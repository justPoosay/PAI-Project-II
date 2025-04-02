import { type } from 'arktype';
import { Message, Model } from 'common';

export const ConversationEntity = type({
  id: 'string',
  name: 'string | null',
  model: Model,
  messages: Message.array(),
  archived: 'boolean',
  created_at: 'Date',
  updated_at: 'Date'
});

export type TConversationEntity = typeof ConversationEntity.infer;
export type TConversationDTO = typeof ConversationEntity.infer;

export const ConversationDTO = Object.freeze({
  convertFromEntity(entity: typeof ConversationEntity.infer) {
    const out = ConversationEntity(entity); // here `ConversationDTO` schema should be used, but both are the same
    return out instanceof type.errors ? null : out;
  }
});
