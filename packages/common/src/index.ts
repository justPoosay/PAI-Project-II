export type { AppRouter } from '../../../apps/backend/src/trpc/index';
export * from './models';
export * from './schemas';

export type Auth = typeof import('../../../apps/backend/src/lib/auth').auth;
