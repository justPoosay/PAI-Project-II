import { z } from "zod";
import {
  ToolCallSchema,
  ClientBoundWebSocketMessageSchema,
  ServerBoundWebSocketMessageSchema,
  ModelSchema,
  MessageSchema, ConversationSchema
} from "./schemas.ts";

/** @description conversation message as held by the client */
export type ClientMessage = z.infer<typeof MessageSchema> & {
  finished: boolean;
}

export type ClientBoundWebSocketMessage = z.infer<typeof ClientBoundWebSocketMessageSchema>
export type ServerBoundWebSocketMessage = z.infer<typeof ServerBoundWebSocketMessageSchema>

export type ToolCall = z.infer<typeof ToolCallSchema>
export type Model = z.infer<typeof ModelSchema>