import type { Model } from './index';

export interface ModelInfo {
  capabilities: Array<'toolUsage' | 'imageInput' | 'reasoning' | string>;
  name: string;
  logoSrc: string;
  description: string | null;
}

/** @description general model info, useful for both front-end and back-end */
export const modelInfo = {
  'claude-3-5-sonnet': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Claude 3.5 Sonnet',
    logoSrc: '/img/anthropic.svg',
    description:
      "Anthropic's latest model, excelling at detailed analysis and precise responses. Especially good at code and math."
  },
  'o3-mini': {
    capabilities: ['toolUsage', 'reasoning'],
    name: 'ChatGPT o3-mini',
    logoSrc: '/img/openai.svg',
    description: "OpenAI's newest mini model. Pretty good at general tasks and coding."
  },
  'gpt-4o': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'ChatGPT 4o',
    logoSrc: '/img/openai.svg',
    description: "OpenAI's flagship model. Excellent general-purpose model. Relatively fast."
  },
  'gpt-4o-mini': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'ChatGPT 4o Mini',
    logoSrc: '/img/openai.svg',
    description: 'A smaller, faster version of GPT-4. Pretty good at general tasks and coding.'
  },
  'grok-2': {
    capabilities: ['toolUsage'],
    name: 'Grok 2',
    logoSrc: '/img/xai.svg',
    description: null
  },
  'grok-beta': {
    capabilities: ['toolUsage'],
    name: 'Grok Beta',
    logoSrc: '/img/xai.svg',
    description: null
  },
  'llama-3.3-70b-versatile': {
    capabilities: ['toolUsage'],
    name: 'Llama 3.3 70b',
    logoSrc: '/img/meta.svg',
    description:
      'Extremely fast open-source model running on Groq hardware. Great for quick responses and coding tasks. Not as accurate as Claude or GPT-4o.'
  },
  'mixtral-8x7b-32768': {
    capabilities: ['toolUsage'],
    name: 'Mixtral 8x7b',
    logoSrc: '/img/mistral.svg',
    description: null
  }
} satisfies Record<Model, ModelInfo>;
