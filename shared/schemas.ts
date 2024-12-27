import { z } from "zod";

export const ModelSchema = z.enum(["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "grok-beta", "grok-2"]);

export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.unknown()),
});

export const MessageSchema = z.union([
  z.object({
    role: z.literal("user"),
    content: z.string(),
  }),
  z.object({
    role: z.literal("assistant"),
    content: z.string(),
    author: ModelSchema,
    toolCalls: z.array(ToolCallSchema).optional()
  }),
]);

export const ConversationSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  updated_at: z.string()
});

export const routes = {
  "[id]": {
    "messages": z.array(MessageSchema),
  },
  "conversations": z.array(ConversationSchema),
  "create": ConversationSchema
} as const;

/** @description message sent from the server to the client */
export const ClientBoundWebSocketMessageSchema = z.union([
  z.object({
    role: z.literal("chunk"),
    type: z.literal("tool-call"),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.unknown()),
  }),
  z.object({
    role: z.literal("chunk"),
    type: z.literal("tool-result"),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.unknown()),
    result: z.unknown(),
  }),
  z.object({
    role: z.literal("chunk"),
    type: z.literal("text-delta"),
    textDelta: z.string(),
  }),
  z.object({
    role: z.literal("finish"),
  }),
  z.object({
    role: z.literal("rename"),
    name: z.string(),
  }),
  z.object({
    role: z.literal("setup"),
    model: ModelSchema
  }),
  z.object({
    role: z.literal("ack")
  })
]);

/** @description message sent from the client to the server */
export const ServerBoundWebSocketMessageSchema = z.union([
  z.object({
    role: z.literal("message"),
    action: z.literal("create"),
    content: z.string(),
  }),
  z.object({
    role: z.literal("action"),
    action: z.literal("abort"),
  }),
  z.object({
    role: z.literal("modify"),
    action: z.literal("model"),
    model: ModelSchema
  })
]);