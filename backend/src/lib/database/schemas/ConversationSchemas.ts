import { date, intersection, object, string, z } from "zod";
import { ConversationSchema, MessageSchema } from "../../../../../shared/schemas";
import { omit } from "../../utils";

export const conversationEntitySchema = object({
  messages: intersection(object({ id: string() }), MessageSchema).array(),
  archived: z.boolean(),
  created_at: date(),
  updated_at: date(),
  ...omit(ConversationSchema.shape, ["updated_at"]),
});

export const conversationDTOSchema = conversationEntitySchema;

export type ConversationEntity = z.infer<typeof conversationEntitySchema>;
export type ConversationDTO = z.infer<typeof conversationDTOSchema>;

export const ConversationDTO = {
  convertFromEntity(entity: ConversationEntity): ConversationDTO {
    return conversationDTOSchema.parse(entity);
  },
};