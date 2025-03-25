import { date, object, z } from 'zod';
import { ConversationSchema, MessageSchema } from 'shared';
import { omit } from '~/lib/utils';

export const conversationEntitySchema = object({
  messages: MessageSchema.array(),
  archived: z.boolean(),
  created_at: date(),
  updated_at: date(),
  ...omit(ConversationSchema.shape, ['updated_at'])
});

export const conversationDTOSchema = conversationEntitySchema;

export type ConversationEntity = z.infer<typeof conversationEntitySchema>;
export type ConversationDTO = z.infer<typeof conversationDTOSchema>;

export const ConversationDTO = {
  convertFromEntity(entity: ConversationEntity) {
    const { data } = conversationDTOSchema.safeParse(entity);
    return data ?? null;
  }
} as const;
