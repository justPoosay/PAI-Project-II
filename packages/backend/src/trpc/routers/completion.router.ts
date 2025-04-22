import { TRPCError } from '@trpc/server';
import { streamText } from 'ai';
import { type } from 'arktype';
import { models, type MessageChunk } from 'common';
import { ObjectId } from 'mongodb';
import { getTextContent } from '../../core/utils';
import { publicProcedure } from '../trpc';

export const completionRouter = publicProcedure
  .input(
    type({
      message: 'string>0',
      for: 'string.hex==24'
    })
  )
  .query(async function* ({ input, ctx, signal }) {
    if (!ctx.auth?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const _id = new ObjectId(input.for);
    const c = await ctx.db.conversations.findOne({
      _id,
      deleted: false,
      userId: new ObjectId(ctx.auth.user.id)
    });
    if (!c) return;

    const model = c.model ?? 'o4-mini';
    const reasoningEffort = c.reasoningEffort;

    c.messages.push({ role: 'user', content: input.message });
    c.messages.push({ role: 'assistant', chunks: [], author: model });

    await ctx.db.conversations.updateOne({ _id }, { messages: c.messages });

    const options: Parameters<typeof streamText>[0] = {
      model: models[model].model,
      messages: c.messages.map(m =>
        m.role === 'user' ? m : { role: 'assistant', content: getTextContent(m.chunks) }
      ),
      abortSignal: signal
    };

    if (model === 'claude-3-7-sonnet-thinking' && reasoningEffort) {
      let budgetTokens = 1024;
      if (reasoningEffort === 'medium') budgetTokens = 2048;
      if (reasoningEffort === 'high') budgetTokens = 4096;

      options.providerOptions = {
        anthropic: {
          thinking: {
            type: 'enabled',
            budgetTokens
          }
        }
      };
    }

    if ((model === 'o4-mini' || model === 'o3-mini') && reasoningEffort) {
      options.providerOptions = {
        openai: {
          reasoningEffort
        }
      };
    }

    const stream = streamText(options);

    try {
      for await (const chunk of stream.fullStream) {
        if (
          chunk.type !== 'tool-call' &&
          chunk.type !== 'text-delta' &&
          chunk.type !== 'reasoning'
        ) {
          continue;
        }

        const last = c.messages.at(-1)!;
        if (last.role === 'assistant') {
          last.chunks.push(chunk);
        }

        yield chunk;
      }

      const last = c.messages.at(-1)!;
      if (last.role === 'assistant') {
        last.chunks.push(null);
      }

      yield null;
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'AbortError' ? 'Aborted by user' : `${err}`;
      const errorChunk: typeof MessageChunk.infer = { type: 'error', message };
      const last = c.messages.at(-1)!;
      if (last.role === 'assistant') {
        last.chunks.push(errorChunk);
      }
      yield errorChunk;
    } finally {
      await ctx.db.conversations.updateOne({ _id }, { messages: c.messages });
    }
  });
