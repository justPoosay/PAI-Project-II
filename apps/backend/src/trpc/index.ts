import { chatRouter } from './routers/chat.router';
import { completionRouter } from './routers/completion.router';
import { modelRouter } from './routers/model.router';
import { stripeRouter } from './routers/stripe.router';
import { router } from './trpc';

export const appRouter = router({
  model: modelRouter,
  chat: chatRouter,
  completion: completionRouter,
  stripe: stripeRouter
});

export type AppRouter = typeof appRouter;
