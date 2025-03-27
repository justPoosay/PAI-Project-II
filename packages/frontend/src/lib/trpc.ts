import { createTRPCClient, httpBatchStreamLink } from '@trpc/client';
import type { AppRouter } from 'common';
import SuperJSON from 'superjson';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchStreamLink({
      url: '/api/trpc',
      transformer: SuperJSON
    })
  ]
});
