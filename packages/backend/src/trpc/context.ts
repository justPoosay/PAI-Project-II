import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { ConversationService } from '../lib/database/services/ConversationService';

export function createContext({ req, resHeaders }: FetchCreateContextFnOptions) {
  return {
    req,
    resHeaders,
    db: {
      conversations: ConversationService
    }
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
