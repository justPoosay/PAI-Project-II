import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { Serve } from 'bun';
import { auth } from './lib/auth';
import { appRouter as router } from './trpc';
import { createContext } from './trpc/context';

export default {
  async fetch(req) {
    const url = new URL(req.url);

    // logger.trace(`${req.method} ${url.pathname}`);

    if (url.pathname.startsWith('/api/auth')) {
      return auth.handler(req);
    }

    return fetchRequestHandler({
      endpoint: '/trpc',
      req,
      createContext,
      router
    });
  }
} satisfies Serve;
