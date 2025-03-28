import { streamText, type TextStreamPart } from 'ai';
import { type } from 'arktype';
import { models, type MessageChunk } from 'common';
import { getTextContent } from '../../core/utils';
import { AsyncQueue } from '../../lib/async-queue';
import { publicProcedure } from '../trpc';

export const completionRouter = publicProcedure
  .input(
    type({
      message: 'string>0',
      for: 'string'
    })
  )
  .query(async function* ({ input, ctx }) {
    const c = await ctx.db.conversations.findOne(input.for, { archived: false });

    if (!c) {
      return;
    }

    c.messages.push(
      { role: 'user', content: input.message },
      { role: 'assistant', chunks: [], author: c.model }
    );

    await ctx.db.conversations.update(c.id, { messages: c.messages });

    const allowedChunks = ['reasoning', 'text-delta', 'tool-call', 'tool-result'] satisfies Exclude<
      NonNullable<typeof MessageChunk.infer>['type'],
      'error'
    >[];

    const queue = new AsyncQueue<typeof MessageChunk.infer>();

    const stream = streamText({
      model: models[c.model].model,
      messages: c.messages.map(v =>
        v.role === 'user' ? v : { role: 'assistant', content: getTextContent(v.chunks) }
      ),
      onChunk({ chunk }) {
        if ((allowedChunks as string[]).includes(chunk.type)) {
          const correctlyTypedChunk = chunk as Extract<
            TextStreamPart<any>, // eslint-disable-line
            { type: (typeof allowedChunks)[number] }
          >;
          const last = c.messages.at(-1);
          if (last && last.role === 'assistant') {
            last.chunks.push(correctlyTypedChunk);
          }
          queue.enqueue(correctlyTypedChunk);
        }
      }
    });
    let streaming = true;

    new Promise<void>(async resolve => {
      for await (const chunk of stream.textStream) {
      }
      resolve();
    })
      .then(() => {
        queue.enqueue(null);
        const last = c.messages.at(-1);
        if (last && last.role === 'assistant') {
          last.chunks.push(null);
        }
      })
      .catch(e => {
        const message = e.name === 'AbortError' ? 'Aborted by user' : `${e}`;
        queue.enqueue({ type: 'error', message });
        const last = c.messages.at(-1);
        if (last && last.role === 'assistant') {
          last.chunks.push({ type: 'error', message });
        }
      })
      .finally(() => {
        streaming = false;
      });

    while (streaming || !queue.isEmpty()) {
      const chunk = await queue.dequeue();
      yield chunk;
      if (chunk === null) {
        break;
      }
    }

    await ctx.db.conversations.update(c.id, {
      messages: c.messages
    });
  });
