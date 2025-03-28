import { completionRouter } from './routers/completion';
import { conversationRouter } from './routers/conversation';
import { conversationsRouter } from './routers/conversations';
import { modelsRouter } from './routers/models';
import { router } from './trpc';

export const appRouter = router({
  models: modelsRouter,
  conversations: conversationsRouter,
  conversation: conversationRouter,
  completion: completionRouter
});

export type AppRouter = typeof appRouter;
