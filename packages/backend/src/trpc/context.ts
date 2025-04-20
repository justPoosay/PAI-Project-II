import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from '../lib/auth';
import { ConversationService } from '../lib/db';
import logger from '../lib/logger';

export async function createContext({ req, resHeaders, info }: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession(req);

  logger.trace('[tRPC]', info.calls.map(c => c.path).join(','), 'by', session?.user ?? null);

  return {
    req,
    resHeaders,
    db: {
      conversations: ConversationService
    },
    auth: session
      ? {
          user: session.user,
          session: session.session
        }
      : null
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
