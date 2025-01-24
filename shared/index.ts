import { z } from "zod";
import {
  ClientBoundWebSocketMessageSchema,
  ServerBoundWebSocketMessageSchema,
  ModelSchema,
  MessageSchema
} from "./schemas";

/** @description conversation message as held by the client */
export type ClientMessage = z.infer<typeof MessageSchema> & {
  finished: boolean;
}

export type ClientBoundWebSocketMessage = z.infer<typeof ClientBoundWebSocketMessageSchema>
export type ServerBoundWebSocketMessage = z.infer<typeof ServerBoundWebSocketMessageSchema>

export type Model = z.infer<typeof ModelSchema>