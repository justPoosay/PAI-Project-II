import { z, object, string, intersection, date } from "zod";
import { ObjectId } from "mongodb";
import { MessageSchema, ModelSchema } from "../../../../../shared/schemas";
import { omit } from "../../utils";

export const conversationEntitySchema = object({
  _id: z.instanceof(ObjectId),
  name: string().nullable(),
  messages: intersection(object({ id: string() }), MessageSchema).array(),
  archived: z.boolean(),
  model: ModelSchema,
  created_at: date(),
  updated_at: date(),
});

export const conversationDTOSchema = object({
  id: string(),
  ...omit(conversationEntitySchema.shape, ["_id"]),
});

export type ConversationEntity = z.infer<typeof conversationEntitySchema>;
export type ConversationDTO = z.infer<typeof conversationDTOSchema>;

export const ConversationDTO = {
  convertFromEntity(entity: ConversationEntity): ConversationDTO {
    const candidate = {
      id: entity._id.toHexString(),
      ...omit(entity, ["_id"]),
    };
    return conversationDTOSchema.parse(candidate);
  },
};