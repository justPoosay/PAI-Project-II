import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import type { LanguageModelV1 } from 'ai';
import type { Model } from '.';

export interface ModelInfo {
  capabilities: Array<'toolUsage' | 'imageInput' | 'reasoning' | (string & {})>;
  name: string;
  logoSrc: string;
  description: string | null;
  model: LanguageModelV1;
  env: string;
}

export const models: Record<Model, ModelInfo> = {
  'claude-3-5-sonnet': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Claude 3.5 Sonnet',
    logoSrc: '/img/anthropic.svg',
    description:
      "Anthropic's latest model, excelling at detailed analysis and precise responses. Especially good at code and math.",
    model: anthropic('claude-3-5-sonnet-latest'),
    env: 'ANTHROPIC_API_KEY'
  },
  'o3-mini': {
    capabilities: ['toolUsage', 'reasoning'],
    name: 'ChatGPT o3-mini',
    logoSrc: '/img/openai.svg',
    description: "OpenAI's newest mini model. Pretty good at general tasks and coding.",
    model: openai('o3-mini'),
    env: 'OPENAI_API_KEY'
  },
  'gpt-4o': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'ChatGPT 4o',
    logoSrc: '/img/openai.svg',
    description: "OpenAI's flagship model. Excellent general-purpose model. Relatively fast.",
    model: openai('gpt-4o'),
    env: 'OPENAI_API_KEY'
  },
  'gpt-4o-mini': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'ChatGPT 4o Mini',
    logoSrc: '/img/openai.svg',
    description: 'A smaller, faster version of GPT-4. Pretty good at general tasks and coding.',
    model: openai('gpt-4o-mini'),
    env: 'OPENAI_API_KEY'
  },
  'grok-2': {
    capabilities: ['toolUsage'],
    name: 'Grok 2',
    logoSrc: '/img/xai.svg',
    description: null,
    model: xai('grok-2'),
    env: 'XAI_API_KEY'
  },
  'grok-beta': {
    capabilities: ['toolUsage'],
    name: 'Grok Beta',
    logoSrc: '/img/xai.svg',
    description: null,
    model: xai('grok-beta'),
    env: 'XAI_API_KEY'
  },
  'llama-3.3-70b-versatile': {
    capabilities: ['toolUsage'],
    name: 'Llama 3.3 70b',
    logoSrc: '/img/meta.svg',
    description:
      'Extremely fast open-source model running on Groq hardware. Great for quick responses and coding tasks. Not as accurate as Claude or GPT-4o.',
    model: groq('llama-3.3-70b-versatile'),
    env: 'GROQ_API_KEY'
  },
  'mixtral-8x7b-32768': {
    capabilities: ['toolUsage'],
    name: 'Mixtral 8x7b',
    logoSrc: '/img/mistral.svg',
    description: null,
    model: groq('mixtral-8x7b-32768'),
    env: 'GROQ_API_KEY'
  }
};
