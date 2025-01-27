import { z } from "zod";

export const ModelSchema = z.enum([
  "gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet", "grok-2", "grok-beta", "llama-3.3-70b-versatile", "mixtral-8x7b-32768",
]);

export const AttachmentSchema = z.object({
  id: z.string(),
  image: z.boolean(),
});

export const MessageChunkSchema = z.union([
  z.object({
    type: z.literal("tool-call"),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal("tool-result"),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.unknown()),
    result: z.unknown(),
  }),
  z.object({
    type: z.literal("text-delta"),
    textDelta: z.string(),
  }),
]);

export const MessageSchema = z.union([
  z.object({
    role: z.literal("user"),
    content: z.string(),
    attachmentIds: z.string().array().optional(),
  }),
  z.object({
    role: z.literal("assistant"),
    chunks: z.array(MessageChunkSchema),
    author: ModelSchema,
  }),
]);

export const ConversationSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  model: ModelSchema,
  updated_at: z.string(),
});

export const routes = {
  "[id]": {
    "messages": z.array(MessageSchema),
  },
  "conversations": z.array(ConversationSchema),
  "create": ConversationSchema,
  "models": z.array(ModelSchema),
  "upload": z.object({
    id: z.string(),
    hash: z.string(),
    image: z.boolean(),
  }).array(),
} as const;

/** @description message sent from the server to the client */
export const ClientBoundWebSocketMessageSchema = z.union([
  MessageChunkSchema.transform((val) => ({ role: "chunk" as const, ...val })),
  z.object({
    role: z.literal("finish"),
  }),
  z.object({
    role: z.literal("rename"),
    name: z.string(),
  }),
  z.object({
    role: z.literal("pong"),
  }),
  z.object({
    role: z.literal("error"),
    title: z.string(),
    message: z.string(),
    pof: z.string().optional(), // Point of failure
  }),
]);

/** @description message sent from the client to the server */
export const ServerBoundWebSocketMessageSchema = z.union([
  z.object({
    role: z.literal("message"),
    action: z.literal("create"),
    content: z.string(),
    attachments: z.array(AttachmentSchema).optional(),
    model: ModelSchema.optional(),
  }),
  z.object({
    role: z.literal("action"),
    action: z.literal("abort"),
  }),
  z.object({
    role: z.literal("ping"),
  }),
]);

export const SSESchema = z.union([
  z.object({
    kind: z.literal("rename"),
    for: ConversationSchema.shape.id,
    newName: z.string(),
  }),
  z.object({
    kind: z.literal("error"),
    for: ConversationSchema.shape.id,
    title: z.string(),
    message: z.string(),
  }),
  z.object({
    kind: z.literal("keep-alive"),
  }),
]);