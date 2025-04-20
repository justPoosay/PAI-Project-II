import { type } from 'arktype';

export const Model = type(
  "'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet' | 'grok-3' | 'llama-3.3-70b-versatile' | 'o3-mini' | 'deepseek-r1-distill-llama-70b' | 'deepseek-r1-distill-qwen-32b' | 'claude-3-7-sonnet' | 'o4-mini' | 'claude-3-7-sonnet-thinking'"
);

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

export const Conversation = type({
  id: 'string',
  'name?': 'string | null',
  'model?': Model,
  'reasoningEffort?': Effort,
  updatedAt: 'Date'
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
