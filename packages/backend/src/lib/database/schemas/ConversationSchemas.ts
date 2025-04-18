import { type } from 'arktype';
import { Conversation, Message } from 'common';

export const ConversationEntity = Conversation.and({
  messages: Message.array(),
  archived: 'boolean',
  created_at: 'Date'
});

export type TConversationEntity = typeof ConversationEntity.infer;
export type TConversationDTO = typeof ConversationEntity.infer;

export const ConversationDTO = Object.freeze({
  convertFromEntity(entity: typeof ConversationEntity.infer) {
    const out = ConversationEntity(entity); // here `ConversationDTO` schema should be used, but both are the same
    return out instanceof type.errors ? null : out;
  }
});
