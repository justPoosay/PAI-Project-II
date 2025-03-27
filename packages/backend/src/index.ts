import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { Serve } from 'bun';
import { appRouter as router } from './trpc';
import { createContext } from './trpc/context';

export default {
  async fetch(req) {
    return fetchRequestHandler({
      endpoint: '/trpc',
      req,
      createContext,
      router
    });
  }
} satisfies Serve;
