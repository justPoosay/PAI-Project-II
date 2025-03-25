import { type } from 'arktype';
import { z } from 'zod';

export const ModelSchema = z.enum([
  'gpt-4o',
  'gpt-4o-mini',
  'claude-3-5-sonnet',
  'grok-2',
  'grok-beta',
  'llama-3.3-70b-versatile',
  'mixtral-8x7b-32768',
  'o3-mini'
]);
// TODO: remove the zod schema and use the arktype one
export const modelSchema = type(
  "'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet' | 'grok-2' | 'grok-beta' | 'llama-3.3-70b-versatile' | 'mixtral-8x7b-32768' | 'o3-mini'"
);

export const AttachmentSchema = z.object({
  id: z.string(),
  image: z.boolean()
});

export const MessageChunkSchema = z.union([
  z.object({
    type: z.literal('tool-call'),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.unknown())
  }),
  z.object({
    type: z.literal('tool-result'),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.unknown()),
    result: z.unknown()
  }),
  z.object({
    type: z.literal('text-delta'),
    textDelta: z.string()
  }),
  z.object({
    type: z.literal('reasoning'),
    textDelta: z.string()
  }),
  // terminators (the last chunk in the message, it's absence indicates the fact that the completion isn't fully completed yet)
  z.object({
    type: z.literal('error'),
    message: z.string()
  }),
  z.null()
]);

export const MessageSchema = z.union([
  z.object({
    role: z.literal('user'),
    content: z.string(),
    attachmentIds: z.string().array().optional()
  }),
  z.object({
    role: z.literal('assistant'),
    chunks: z.array(MessageChunkSchema),
    author: ModelSchema
  })
]);

export const ConversationSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  model: ModelSchema,
  updated_at: z.string()
});

export const routes = {
  '[id]': {
    messages: MessageSchema.array()
  },
  conversations: z.array(ConversationSchema),
  create: ConversationSchema,
  models: z.array(ModelSchema),
  upload: z
    .object({
      id: z.string(),
      hash: z.string(),
      image: z.boolean()
    })
    .array()
} as const;

export const SSESchema = z.union([
  z.object({
    kind: z.literal('rename'),
    for: ConversationSchema.shape.id,
    newName: z.string()
  }),
  z.object({
    kind: z.literal('error'),
    for: ConversationSchema.shape.id,
    title: z.string(),
    message: z.string()
  }),
  z.object({
    kind: z.literal('keep-alive')
  })
]);
