import type { LanguageModelV1 } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import type { Model as TModel } from '/shared/';
import { type ModelInfo, modelInfo } from '/shared/constants';
import { xai } from '@ai-sdk/xai';
import { env } from '~/lib/utils.ts';
import { groq } from '@ai-sdk/groq';

type Model = ModelInfo & {
  model: LanguageModelV1;
  env: string;
};

/** @description model info, useful only for back-end */
export const models = {
  'claude-3-5-sonnet': {
    ...modelInfo['claude-3-5-sonnet'],
    model: anthropic('claude-3-5-sonnet-latest'),
    env: 'ANTHROPIC_API_KEY'
  },
  'o3-mini': {
    ...modelInfo['o3-mini'],
    model: openai('o3-mini'),
    env: 'OPENAI_API_KEY'
  },
  'gpt-4o': {
    ...modelInfo['gpt-4o'],
    model: openai('gpt-4o'),
    env: 'OPENAI_API_KEY'
  },
  'gpt-4o-mini': {
    ...modelInfo['gpt-4o-mini'],
    model: openai('gpt-4o-mini'),
    env: 'OPENAI_API_KEY'
  },
  'grok-2': {
    ...modelInfo['grok-2'],
    model: xai('grok-2'),
    env: 'XAI_API_KEY'
  },
  'grok-beta': {
    ...modelInfo['grok-beta'],
    model: xai('grok-beta'),
    env: 'XAI_API_KEY'
  },
  'llama-3.3-70b-versatile': {
    ...modelInfo['llama-3.3-70b-versatile'],
    model: groq('llama-3.3-70b-versatile'),
    env: 'GROQ_API_KEY'
  },
  'mixtral-8x7b-32768': {
    ...modelInfo['mixtral-8x7b-32768'],
    model: groq('mixtral-8x7b-32768'),
    env: 'GROQ_API_KEY'
  }
} as const satisfies Record<TModel, Model>;

export const availableModels = Object.entries(models)
  .filter(v => !!env[v[1].env])
  .map(v => v[0] as TModel);
