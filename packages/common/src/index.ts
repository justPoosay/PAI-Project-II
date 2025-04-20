export type { AppRouter } from '../../backend/src/trpc/index';
export * from './models';
export * from './schemas';

export type Auth = typeof import('../../backend/src/lib/auth').auth;
