import { type } from 'arktype';
import { models } from './models';
import { keys } from './utils';

export const Model = type.or(...keys(models).map(key => `'${key}'` as const));

export const Effort = type("'low' | 'medium' | 'high'");

export const Attachment = type({
  id: 'string',
  image: 'boolean'
});

export const MessageChunk = type.or(
  {
    type: "'tool-call'",
    toolCallId: 'string',
    toolName: 'string',
    args: 'Record<string, unknown>'
  },
  {
    type: "'tool-result'",
    toolCallId: 'string',
    toolName: 'string',
    args: 'Record<string, unknown>',
    result: 'unknown'
  },
  {
    type: "'text-delta'",
    textDelta: 'string'
  },
  {
    type: "'reasoning'",
    textDelta: 'string'
  },
  {
    type: "'error'",
    message: 'string'
  },
  'null'
);

export const UserMessage = type({
  role: "'user'",
  content: 'string',
  'attachmentIds?': 'string[]'
});

export const AssistantMessage = type({
  role: "'assistant'",
  chunks: MessageChunk.array(),
  author: Model
});

export const Message = type.or(UserMessage, AssistantMessage);

export const Chat = type({
  id: 'string',
  'name?': 'string | null',
  'model?': Model,
  'reasoningEffort?': Effort,
  updatedAt: 'Date'
});

export type Model = typeof Model.infer;
export type Effort = typeof Effort.infer;
export type Attachment = typeof Attachment.infer;
export type MessageChunk = typeof MessageChunk.infer;
export type UserMessage = typeof UserMessage.infer;
export type AssistantMessage = typeof AssistantMessage.infer;
export type Message = typeof Message.infer;
export type Chat = typeof Chat.infer;
