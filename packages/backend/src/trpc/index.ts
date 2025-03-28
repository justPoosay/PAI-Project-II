import { streamText, type TextStreamPart } from 'ai';
import { type } from 'arktype';
import { MessageChunk, Model, models } from 'common';
import { getAvailableModels, getTextContent } from '../core/utils';
import { AsyncQueue } from '../lib/async-queue';
import { publicProcedure, router } from './trpc';

export const appRouter = router({
  models: publicProcedure.query(getAvailableModels),
  conversations: {
    get: publicProcedure.query(opts =>
      opts.ctx.db.conversations
        .find({ archived: false })
        .then(v => v.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime()))
    ),
    create: publicProcedure.input(type({ 'model?': Model })).mutation(opts =>
      opts.ctx.db.conversations.create({
        model: opts.input.model ?? getAvailableModels()[0] ?? 'o3-mini',
        name: null,
        messages: [],
        archived: false
      })
    )
  },
  conversation: {
    delete: publicProcedure
      .input(type({ id: 'string' }))
      .mutation(
        async opts =>
          void (await opts.ctx.db.conversations.update(opts.input.id, { archived: true }))
      ),
    modify: publicProcedure
      .input(
        type({
          id: 'string',
          'name?': 'string | null',
          'model?': Model
        })
      )
      .mutation(async opts => opts.ctx.db.conversations.update(opts.input.id, opts.input)),
    getMessages: publicProcedure
      .input(type({ id: 'string' }))
      .query(async opts =>
        opts.ctx.db.conversations
          .findOne(opts.input.id, { archived: false })
          .then(v => v?.messages ?? [])
      )
  },
  completion: publicProcedure
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

      const allowedChunks = [
        'reasoning',
        'text-delta',
        'tool-call',
        'tool-result'
      ] satisfies Exclude<NonNullable<typeof MessageChunk.infer>['type'], 'error'>[];

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
    })
});

export type AppRouter = typeof appRouter;
