import { z } from "zod";
import {
  ChatSchema,
  ToolCallSchema,
  ClientBoundWebSocketMessageSchema,
  ServerBoundWebSocketMessageSchema
} from "./schemas.ts";

/** @description conversation message as held by the client */
export interface ClientMessage {
  role: "user" | "assistant";
  content: string;
  finished: boolean;
  toolCalls?: ToolCall[];
}

export type ClientBoundWebSocketMessage = z.infer<typeof ClientBoundWebSocketMessageSchema>
export type ServerBoundWebSocketMessage = z.infer<typeof ServerBoundWebSocketMessageSchema>

export type ToolCall = z.infer<typeof ToolCallSchema>
export type Chat = z.infer<typeof ChatSchema>