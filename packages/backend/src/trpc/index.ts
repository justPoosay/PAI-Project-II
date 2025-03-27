import { type } from 'arktype';
import { Model } from 'common';
import { getAvailableModels } from '../core/utils';
import { publicProcedure, router } from './trpc';

export const appRouter = router({
  models: publicProcedure.query(getAvailableModels),
  conversations: router({
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
  }),
  conversation: router({
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
  })
});

export type AppRouter = typeof appRouter;
