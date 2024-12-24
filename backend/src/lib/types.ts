import type { MatchedRoute } from "bun";
import type { TConversation } from "../core/Conversation.ts";

export type AppRequest = Request & { route: MatchedRoute };

export type WSData =
  | { type: "chat", id: string, instance?: TConversation };