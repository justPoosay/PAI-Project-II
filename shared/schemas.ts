import { z } from "zod";

export const MsgEndpointSchema = z.array(
  z.object({
    role: z.union([z.literal("user"), z.literal("assistant")]),
    content: z.string(),
    toolCalls: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        args: z.record(z.unknown())
      })
    ).optional()
  })
);