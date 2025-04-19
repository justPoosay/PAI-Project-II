import { streamText } from 'ai';
import { type } from 'arktype';
import { Effort, models, type MessageChunk } from 'common';
import { includes } from 'common/utils';
import { getTextContent } from '../../core/utils';
import { publicProcedure } from '../trpc';

export const completionRouter = publicProcedure
  .input(
    type({
      message: 'string>0',
      for: 'string'
    })
  )
  .query(async function* ({ input, ctx }) {
    // 1) load & append the new “user” and empty “assistant” messages
    const c = await ctx.db.conversations.findOne({ id: input.for, deleted: false });
    if (!c) return;

    c.messages.push(
      { role: 'user', content: input.message },
      { role: 'assistant', chunks: [], author: c.model }
    );
    await ctx.db.conversations.update({ id: c.id }, { messages: c.messages });

    // 2) set up the stream
    const allowed = ['reasoning', 'text-delta', 'tool-call', 'tool-result'] satisfies Exclude<
      NonNullable<typeof MessageChunk.infer>['type'],
      'error'
    >[];
    const stream = streamText({
      model: models[c.model].model,
      messages: c.messages.map(m =>
        m.role === 'user' ? m : { role: 'assistant', content: getTextContent(m.chunks) }
      ),
      ...(includes(models[c.model].capabilities, 'effortControl')
        ? {
            providerOptions: {
              ...{
                'openai.chat': {
                  openai: {
                    reasoningEffort: c.reasoningEffort ?? 'low'
                  }
                },
                'anthropic.messages': {
                  anthropic: {
                    thinking: {
                      type: 'enabled',
                      budgetTokens: (
                        {
                          low: 1024,
                          medium: 2048,
                          high: 4096
                        } satisfies { [K in typeof Effort.infer]: number }
                      )[c.reasoningEffort ?? 'low']
                    }
                  }
                }
              }[models[c.model].model.provider]
            }
          }
        : {})
    });

    try {
      // 3) for‑await directly on the ai.fullStream
      for await (const chunk of stream.fullStream) {
        if (!includes(allowed, chunk.type)) continue;
        const correctlyTypedChunk = chunk as Extract<
          typeof chunk,
          { type: (typeof allowed)[number] }
        >;
        // push into conversation state
        const last = c.messages.at(-1)!;
        if (last.role === 'assistant') {
          last.chunks.push(correctlyTypedChunk);
        }
        // stream it back to the client
        yield correctlyTypedChunk;
      }

      // 4) signal “end of stream” (same as null)
      const last = c.messages.at(-1)!;
      if (last.role === 'assistant') {
        last.chunks.push(null);
      }
      yield null;
    } catch (err) {
      // 5) on error, push to state + client
      const message =
        err instanceof Error && err.name === 'AbortError' ? 'Aborted by user' : `${err}`;
      const errorChunk: typeof MessageChunk.infer = { type: 'error', message };
      const last = c.messages.at(-1)!;
      if (last.role === 'assistant') {
        last.chunks.push(errorChunk);
      }
      yield errorChunk;
    } finally {
      // 6) persist the final state of the conversation
      await ctx.db.conversations.update({ id: c.id }, { messages: c.messages });
    }
  });
