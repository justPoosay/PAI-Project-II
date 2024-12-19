import type { MatchedRoute } from "bun";

export type AppRequest = Request & { route: MatchedRoute };