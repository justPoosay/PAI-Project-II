import type { MatchedRoute } from "bun";
import type { ClientBoundWebSocketMessage, ServerBoundWebSocketMessage } from "../../../shared";

export type AppRequest = Request & { route: MatchedRoute };

export type OutboundWSMessage = ClientBoundWebSocketMessage;
export type InboundWSMessage = ServerBoundWebSocketMessage;