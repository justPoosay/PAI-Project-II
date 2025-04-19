import { type } from 'arktype';
import { Effort, Model } from 'common';
import { publicProcedure, router } from '../trpc';

export const conversationRouter = router({
  delete: publicProcedure.input(type({ id: 'string' })).mutation(async opts => {
    await opts.ctx.db.conversations.update(
      { id: opts.input.id },
      { id: opts.input.id, deleted: true },
      true
    );
  }),
  modify: publicProcedure
    .input(
      type({
        id: 'string',
        'name?': 'string | null',
        'model?': Model,
        'reasoningEffort?': Effort
      })
    )
    .mutation(async opts =>
      opts.ctx.db.conversations.update({ id: opts.input.id, deleted: false }, opts.input)
    ),
  getMessages: publicProcedure
    .input(type({ id: 'string' }))
    .query(async opts =>
      opts.ctx.db.conversations
        .findOne({ id: opts.input.id, deleted: false })
        .then(v => v?.messages ?? [])
    )
});
