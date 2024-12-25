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
    "messages.json": z.array(MessageSchema.extend({ toolCalls: z.array(ToolCallSchema).optional() }))
  },
  "chats.json": z.array(ChatSchema),
} as const;