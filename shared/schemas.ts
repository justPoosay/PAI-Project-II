import { z } from "zod";

export const MessageSchema = z.object({
  role: z.union([z.literal("user"), z.literal("assistant")]),
  content: z.string(),
});

export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.unknown()),
});

export const ChatSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
});

export const routes = {
  "[id]": {
    "messages": z.array(MessageSchema.extend({ toolCalls: z.array(ToolCallSchema).optional() }))
  },
  "conversations": z.array(ChatSchema),
  "create": ChatSchema
} as const;

export const ModelSchema = z.union([
  z.literal("gpt-4o"),
  z.literal("gpt-4o-mini"),
  z.literal("claude-3-5-sonnet")
]);

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