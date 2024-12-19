import type { ClientBoundWebSocketMessage, ServerBoundWebSocketMessage } from "../../shared";

export interface Chat {
  id: string;
  name: string;
}

type Role = "user" | "assistant" | "tool" | "function" | "system"

export interface Message {
  role: Role,
  content: string,
  timestamp: number,
}

export type OutboundWSMessage = ServerBoundWebSocketMessage;
export type InboundWSMessage = ClientBoundWebSocketMessage;