import type { MatchedRoute } from 'bun';

export type AppRequest<T = never> = Request & { route: MatchedRoute; data?: T };

export type Merge<T, U> = Omit<T, keyof U> & U;
