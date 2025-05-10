import { type } from 'arktype';
import { Effort, Model } from 'common';
import { omit, pick } from 'common/utils';
import { ObjectId } from 'mongodb';
import { ChatService } from '../../lib/db';
import { protectedProcedure, router } from '../trpc';

export const chatRouter = router({
  delete: protectedProcedure
    .input(type({ id: 'string.hex==24' }))
    .mutation(async ({ ctx, input }) => {
      const userId = new ObjectId(ctx.auth.user.id);
      await ChatService.updateOne(
        { _id: new ObjectId(input.id), userId },
        { deleted: true, userId },
        true
      );
    }),
  modify: protectedProcedure
    .input(
      type({
        id: 'string.hex==24',
        'name?': 'string | null',
        'model?': Model,
        'reasoningEffort?': Effort,
        'pinned?': 'boolean'
      })
    )
    .mutation(({ ctx, input }) =>
      ChatService.updateOne(
        { _id: new ObjectId(input.id), deleted: false, userId: new ObjectId(ctx.auth.user.id) },
        { $set: { ...omit(input, ['id']), updatedAt: new Date() } }
      )
    ),
  get: protectedProcedure.input(type({ id: 'string.hex==24' })).query(async ({ ctx, input }) => {
    return ChatService.findOne({
      _id: new ObjectId(input.id),
      deleted: false,
      userId: new ObjectId(ctx.auth.user.id)
    });
  }),
  list: protectedProcedure.query(async opts => {
    const chats = await ChatService.find({
      userId: new ObjectId(opts.ctx.auth.user.id)
    });

    return chats.filter(c => !c.deleted).map(c => pick(c, ['_id', 'name', 'pinned', 'updatedAt']));
  }),
  new: protectedProcedure.input(type({ 'model?': Model })).mutation(opts =>
    ChatService.insertOne({
      name: null,
      messages: [],
      deleted: false,
      updatedAt: new Date(),
      userId: new ObjectId(opts.ctx.auth.user.id)
    })
  )
});
