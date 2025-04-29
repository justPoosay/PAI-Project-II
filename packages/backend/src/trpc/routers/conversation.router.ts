import { TRPCError } from '@trpc/server';
import { type } from 'arktype';
import { Effort, Model } from 'common';
import { ObjectId } from 'mongodb';
import { ConversationService } from '../../lib/db';
import { publicProcedure, router } from '../trpc';

export const conversationRouter = router({
  delete: publicProcedure.input(type({ id: 'string.hex==24' })).mutation(async ({ ctx, input }) => {
    if (!ctx.auth?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const userId = new ObjectId(ctx.auth.user.id);
    await ConversationService.updateOne(
      { _id: new ObjectId(input.id), userId },
      { deleted: true, userId },
      true
    );
  }),
  modify: publicProcedure
    .input(
      type({
        id: 'string.hex==24',
        'name?': 'string | null',
        'model?': Model,
        'reasoningEffort?': Effort
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth?.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      return ConversationService.updateOne(
        { _id: new ObjectId(input.id), deleted: false, userId: new ObjectId(ctx.auth.user.id) },
        input
      );
    }),
  messages: publicProcedure.input(type({ id: 'string.hex==24' })).query(async ({ ctx, input }) => {
    if (!ctx.auth?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return ConversationService.findOne({
      _id: new ObjectId(input.id),
      deleted: false,
      userId: new ObjectId(ctx.auth.user.id)
    }).then(v => v?.messages ?? []);
  }),
  list: publicProcedure.query(opts => {
    if (!opts.ctx.auth?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return ConversationService.find({
      userId: new ObjectId(opts.ctx.auth.user.id)
    });
  }),
  new: publicProcedure.input(type({ 'model?': Model })).mutation(({ ctx }) => {
    if (!ctx.auth?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return ConversationService.insertOne({
      name: null,
      messages: [],
      deleted: false,
      updatedAt: new Date(),
      userId: new ObjectId(ctx.auth.user.id)
    });
  })
});
