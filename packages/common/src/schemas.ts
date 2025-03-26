import { type } from 'arktype';

export const Model = type(
  "'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet' | 'grok-2' | 'grok-beta' | 'llama-3.3-70b-versatile' | 'mixtral-8x7b-32768' | 'o3-mini'"
);

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

export const Message = type.or(
  {
    role: "'user'",
    content: 'string',
    'attachmentIds?': 'string[]'
  },
  {
    role: "'assistant'",
    chunks: MessageChunk.array(),
    author: Model
  }
);

export const Conversation = type({
  id: 'string',
  name: 'string | null',
  model: Model,
  updated_at: 'string.date'
});

export const SSE = type.or(
  {
    kind: "'rename'",
    for: 'string',
    newName: 'string'
  },
  {
    kind: "'error'",
    for: 'string',
    title: 'string',
    message: 'string'
  },
  {
    kind: "'keep-alive'"
  }
);

export const routes = Object.freeze({
  '[id]': {
    messages: Message.array()
  },
  conversations: Conversation.array(),
  create: Conversation,
  models: Model.array(),
  upload: type({
    id: 'string',
    hash: 'string',
    image: 'boolean'
  }).array()
});
