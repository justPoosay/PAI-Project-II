import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'common';
import SuperJSON from 'superjson';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: SuperJSON
    })
  ]
});
