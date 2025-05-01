import { completionRouter } from './routers/completion.router';
import { conversationRouter } from './routers/conversation.router';
import { modelRouter } from './routers/model.router';
import { stripeRouter } from './routers/stripe.router';
import { router } from './trpc';

export const appRouter = router({
  model: modelRouter,
  conversation: conversationRouter,
  completion: completionRouter,
  stripe: stripeRouter
});

export type AppRouter = typeof appRouter;
