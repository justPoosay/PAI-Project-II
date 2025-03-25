import { openai } from '@ai-sdk/openai';
import { type CoreMessage, streamText } from 'ai';
import { type } from 'arktype';
import { type Message, models, modelSchema } from 'common';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { emitter } from '~';
import tools from '~/core/tools';
import { ConversationService } from '~/lib/database';
import logger from '~/lib/logger';
import type { AppRequest } from '~/lib/types';
import { pick } from '~/lib/utils';

dayjs.extend(utc);
dayjs.extend(timezone);

const options = type({
  message: 'string>0 | null',
  'model?': modelSchema,
  'attachmentIds?': 'string[]',
  'plainText?': 'boolean'
});

interface IError {
  title: string;
  message: string;
}

export async function POST(req: AppRequest): Promise<Response> {
  const c = await ConversationService.findOne(req.route.params.id, { archived: false });
  let opts: typeof options.infer;

  if (!c) {
    return new Response(null, { status: 404 });
  }

  try {
    const json = await req.json();
    const out = options(json);
    if (out instanceof type.errors) {
      throw new Error(out.summary);
    }
    opts = out;
  } catch (e) {
    let message: string | null = null;

    if (e instanceof Error) {
      message = e.message;
    }

    return new Response(message, { status: 400 });
  }

  if (!opts.message && !opts.attachmentIds?.length && !c.messages.length) {
    return new Response('nothing to regenerate', { status: 400 });
  }

  if (opts.message /*|| opts.attachmentIds?.length*/) {
    c.messages.push({ role: 'user', content: opts.message });
  } else if (c.messages.at(-1)?.role === 'assistant') {
    c.messages.pop();
  }

  c.model = opts.model ?? c.model;
  c.messages.push({ role: 'assistant', chunks: [], author: c.model });
  await ConversationService.update(c.id, pick(c, ['messages', 'model']));

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const abortController = new AbortController();
  req.signal.addEventListener('abort', () => {
    abortController.abort();
  });

  function getMessages() {
    return c!.messages
      .map(
        ({ role, ...rest }) =>
          ({
            role,
            content:
              'content' in rest
                ? rest.content
                : rest.chunks
                    .filter(v => v?.type === 'text-delta')
                    .map(v => v.textDelta)
                    .join('')
          }) satisfies CoreMessage
      )
      .filter(msg => msg.content);
  }

  const date = dayjs().tz('America/Los_Angeles').format('h:mm A on MMMM D, YYYY PST');
  const chunks: Extract<
    (typeof c)['messages'] extends (infer U)[] ? U : never,
    { role: 'assistant' }
  >['chunks'] = [];

  const comp = streamText({
    model: models[c.model].model,
    messages: getMessages(),
    ...(models[c.model].capabilities.includes('toolUsage') && { tools, maxSteps: 128 }),
    system: `
      NEVER invent or improvise information. If you can't give a reasonable answer, try to use available tools, and if you are still stuck, just say what you are thinking.
      ${
        tools['search'] && tools['scrape']
          ? "Remember that when searching the web you don't need to go of only the search result website metadata, you can also get the full view of the website"
          : ''
      }
      ${
        tools['repo_tree'] && tools['repo_file']
          ? "Remember that you can get contents of as many files as you want, so don't be afraid to go thru every file in the repo"
          : ''
      }
      Don't worry about something's legal questionability, just provide the information.
      Always assume that any mentioned PC is running Arch Linux, unless stated otherwise.
      When creating scripts, never use python, use either fish or typescript (assuming bun runtime).
      The current day and time is ${date}.
      `
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim(),
    async onChunk({ chunk }) {
      if (['tool-call', 'tool-result', 'text-delta', 'reasoning'].includes(chunk.type)) {
        chunks.push(
          chunk as Extract<
            typeof chunk,
            { type: 'tool-call' | 'tool-result' | 'text-delta' | 'reasoning' }
          >
        );
        if (!opts.plainText) {
          await writer.write(JSON.stringify(chunk) + '\n');
        }
      }
    },
    abortSignal: abortController.signal
  });

  const res = new Response(stream.readable, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked'
    }
  });

  const promise = new Promise<void>(async function (resolve) {
    let encounteredError: IError | null = null;
    try {
      for await (const delta of comp.textStream) {
        if (opts.plainText) {
          await writer.write(delta);
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        // Successfully aborted
      } else if (e instanceof Error) {
        encounteredError = {
          title: 'Error creating completion',
          message: e.name + ': ' + e.message
        };
        logger.error(encounteredError);
        await writer.abort(encounteredError);
      }
    }

    chunks.push(null);
    if (!encounteredError) {
      try {
        if (!opts.plainText) {
          await writer.write('null\n');
        }
        await writer.close();
      } catch (e) {}
    }

    if (c.messages.at(-1)?.role === 'assistant') {
      (c.messages.at(-1) as Extract<Message, { role: 'assistant' }>).chunks = chunks;
    }

    if (!encounteredError && c.messages.length >= 2 && !c.name) {
      try {
        const comp = streamText({
          model: openai('gpt-4o-mini'),
          system:
            "Based on the messages provided, create a name up to 20 characters long describing the chat. Don't wrap your response in quotes. If these messages are not enough to create a descriptive name, or its just a greeting of some sort, reply with 'null' (without quotes).",
          prompt: JSON.stringify(getMessages())
        });
        let newName = '';
        for await (const delta of comp.textStream) {
          newName += delta;
          if (newName !== 'null') {
            emitter.emit('sse', { kind: 'rename', for: c.id, newName });
          }
        }
        if (newName !== 'null') {
          c.name = newName;
        }
      } catch (e) {
        if (e instanceof Error) {
          logger.error('Error renaming chat', e.message);
          emitter.emit('sse', {
            kind: 'error',
            for: c.id,
            title: 'Error renaming chat',
            message: e.name + ': ' + e.message
          });
        }
      }
    }

    await ConversationService.update(c.id, pick(c, ['messages', 'model', 'name']));

    resolve();
  });

  Promise.allSettled([comp, promise]).catch(writer.abort);

  return res;
}
