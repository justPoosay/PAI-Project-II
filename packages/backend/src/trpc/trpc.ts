import { initTRPC, TRPCError } from '@trpc/server';
import SuperJSON from 'superjson';
import { type Context } from './context';

export const t = initTRPC.context<Context>().create({
  transformer: SuperJSON
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.auth?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      auth: ctx.auth
    }
  });
});
