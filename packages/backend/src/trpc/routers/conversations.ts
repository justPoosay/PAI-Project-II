import { TRPCError } from '@trpc/server';
import { type } from 'arktype';
import { Model } from 'common';
import { ObjectId } from 'mongodb';
import { publicProcedure, router } from '../trpc';

export const conversationsRouter = router({
  get: publicProcedure.query(opts => {
    if (!opts.ctx.auth?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return opts.ctx.db.conversations.find({
      userId: new ObjectId(opts.ctx.auth.user.id)
    });
  }),
  create: publicProcedure.input(type({ 'model?': Model })).mutation(({ ctx }) => {
    if (!ctx.auth?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return ctx.db.conversations.create({
      name: null,
      messages: [],
      deleted: false,
      updatedAt: new Date(),
      userId: new ObjectId(ctx.auth.user.id)
    });
  })
});
