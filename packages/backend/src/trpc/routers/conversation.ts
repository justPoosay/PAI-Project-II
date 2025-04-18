import { type } from 'arktype';
import { Effort, Model } from 'common';
import { publicProcedure, router } from '../trpc';

export const conversationRouter = router({
  delete: publicProcedure
    .input(type({ id: 'string' }))
    .mutation(
      async opts => void (await opts.ctx.db.conversations.update(opts.input.id, { archived: true }))
    ),
  modify: publicProcedure
    .input(
      type({
        id: 'string',
        'name?': 'string | null',
        'model?': Model,
        'reasoningEffort?': Effort
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
});
