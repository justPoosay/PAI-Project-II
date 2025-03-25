import type { MatchedRoute } from 'bun';

export type AppRequest<T = never> = Request & { route: MatchedRoute; data?: T };
