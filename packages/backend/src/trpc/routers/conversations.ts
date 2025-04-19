import { type } from 'arktype';
import { Model } from 'common';
import { getAvailableModels } from '../../core/utils';
import { publicProcedure, router } from '../trpc';

export const conversationsRouter = router({
  get: publicProcedure.query(opts =>
    opts.ctx.db.conversations
      .find({ deleted: false })
      .then(v => v.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime()))
  ),
  create: publicProcedure.input(type({ 'model?': Model })).mutation(opts =>
    opts.ctx.db.conversations.create<
      Extract<typeof opts.ctx.db.conversations._schema.infer, { deleted: false }>
    >({
      deleted: false,
      model: opts.input.model ?? getAvailableModels()[0] ?? 'o3-mini',
      reasoningEffort: 'high',
      name: null,
      messages: []
    })
  )
});
