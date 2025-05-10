import { createTRPCClient, httpBatchStreamLink, TRPCClientError } from '@trpc/client';
import ObjectId from 'bson-objectid';
import type { AppRouter } from 'common';
import SuperJSON from 'superjson';

SuperJSON.registerCustom<ObjectId, string>(
  {
    isApplicable: v => v instanceof ObjectId,
    serialize: v => v.toHexString(),
    deserialize: v => new ObjectId(v)
  },
  'ObjectId'
);

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
