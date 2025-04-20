import { createTRPCClient, httpBatchStreamLink, TRPCClientError } from '@trpc/client';
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

export function isTRPCClientError(cause: unknown): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError;
}
