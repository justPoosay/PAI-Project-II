import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModelV1 } from 'ai';

interface Providers {
  anthropic: typeof anthropic;
  groq: typeof groq;
  openai: typeof openai;
  xai: typeof xai;
  openrouter: typeof openrouter;
}

function provider<K extends keyof Providers>(name: Parameters<Providers[K]>[0], provider: K) {
  switch (provider) {
    case 'anthropic':
      return {
        it: anthropic(name),
        env: 'ANTHROPIC_API_KEY'
      } as const;
    case 'groq':
      return {
        it: groq(name),
        env: 'GROQ_API_KEY'
      } as const;
    case 'openai':
      return {
        it: openai(name),
        env: 'OPENAI_API_KEY'
      } as const;
    case 'xai':
      return {
        it: xai(name),
        env: 'XAI_API_KEY'
      } as const;
    case 'openrouter':
      return {
        it: openrouter(name),
        env: 'OPENROUTER_API_KEY'
      } as const;
    default:
      const _: never = provider;
      return _;
  }
}

interface Provider {
  it: LanguageModelV1;
  env: string;
}

export interface ModelInfo {
  capabilities: Array<'toolUsage' | 'imageInput' | 'reasoning' | 'effortControl' | (string & {})>;
  name: string;
  text?: string;
  icon: string;
  description?: string;
  provider: Provider | Provider[];
  options?: Record<string, string[]>;
}

export const models = Object.freeze({
  'o4-mini': {
    capabilities: ['toolUsage', 'reasoning', 'imageInput', 'effortControl'],
    name: 'o4-mini',
    icon: 'openai',
    provider: [provider('o4-mini', 'openai'), provider('openai/o4-mini', 'openrouter')]
  },
  'o3-mini': {
    capabilities: ['toolUsage', 'reasoning', 'effortControl'],
    name: 'o3-mini',
    icon: 'openai',
    provider: [provider('o3-mini', 'openai'), provider('openai/o3-mini', 'openrouter')]
  },
  'claude-4-sonnet': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Claude 4 Sonnet',
    icon: 'anthropic',
    provider: [
      provider('claude-4-sonnet-latest', 'anthropic'),
      provider('anthropic/claude-sonnet-4', 'openrouter')
    ]
  },
  'claude-4-sonnet-thinking': {
    capabilities: ['toolUsage', 'reasoning', 'effortControl', 'imageInput'],
    name: 'Claude 4 Sonnet',
    text: 'Thinking',
    icon: 'anthropic',
    provider: [
      provider('claude-4-sonnet-latest', 'anthropic'),
      provider('anthropic/claude-sonnet-4', 'openrouter')
    ]
  },
  'claude-4-opus': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Claude 4 Opus',
    icon: 'anthropic',
    provider: [
      provider('claude-4-opus-latest', 'anthropic'),
      provider('anthropic/claude-opus-4', 'openrouter')
    ]
  },
  'claude-3-5-sonnet': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Claude 3.5 Sonnet',
    icon: 'anthropic',
    provider: [
      provider('claude-3-5-sonnet-latest', 'anthropic'),
      provider('anthropic/claude-3.5-sonnet', 'openrouter')
    ]
  },
  'claude-3-7-sonnet': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Claude 3.7 Sonnet',
    icon: 'anthropic',
    provider: [
      provider('claude-3-7-sonnet-20250219', 'anthropic'),
      provider('anthropic/claude-3.7-sonnet', 'openrouter')
    ]
  },
  'claude-3-7-sonnet-thinking': {
    capabilities: ['toolUsage', 'reasoning', 'effortControl', 'imageInput'],
    name: 'Claude 3.7 Sonnet',
    text: 'Thinking',
    icon: 'anthropic',
    provider: [
      provider('claude-3-7-sonnet-20250219', 'anthropic'),
      provider('anthropic/claude-3.7-sonnet:thinking', 'openrouter')
    ]
  },
  'gpt-4.1': {
    capabilities: ['imageInput'],
    name: 'GPT 4.1',
    icon: 'openai',
    provider: [provider('gpt-4.1', 'openai'), provider('openai/gpt-4.1', 'openrouter')]
  },
  'gpt-4.1-mini': {
    capabilities: ['imageInput'],
    name: 'GPT 4.1 Mini',
    icon: 'openai',
    provider: [provider('gpt-4.1-mini', 'openai'), provider('openai/gpt-4.1-mini', 'openrouter')]
  },
  'gpt-4o': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'GPT 4o',
    icon: 'openai',
    provider: [provider('gpt-4o', 'openai'), provider('openai/gpt-4o', 'openrouter')]
  },
  'gpt-4o-mini': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'GPT 4o Mini',
    icon: 'openai',
    provider: [provider('gpt-4o-mini', 'openai'), provider('openai/gpt-4o-mini', 'openrouter')]
  },
  'grok-3': {
    capabilities: ['toolUsage'],
    name: 'Grok 3',
    icon: 'xai',
    provider: [provider('grok-3', 'xai'), provider('x-ai/grok-3-beta', 'openrouter')]
  },
  'grok-3-mini': {
    capabilities: ['toolUsage', 'reasoning', 'effortControl'],
    name: 'Grok 3 Mini',
    icon: 'xai',
    provider: [provider('grok-3-mini', 'xai'), provider('x-ai/grok-3-mini-beta', 'openrouter')]
  },
  'llama-3.3-70b-versatile': {
    capabilities: ['toolUsage'],
    name: 'Llama 3.3 70b',
    icon: 'meta',
    provider: [
      provider('llama-3.3-70b-versatile', 'groq'),
      provider('meta-llama/llama-3.3-70b-instruct', 'openrouter')
    ]
  },
  'deepseek-r1-distill-llama-70b': {
    capabilities: ['toolUsage', 'reasoning'],
    name: 'DeepSeek R1',
    text: 'Llama Distilled',
    icon: 'deepseek',
    provider: [
      provider('deepseek-r1-distill-llama-70b', 'groq'),
      provider('deepseek/deepseek-r1-distill-llama-70b', 'openrouter')
    ]
  },
  'deepseek-r1-distill-qwen-32b': {
    capabilities: ['toolUsage', 'reasoning'],
    name: 'DeepSeek R1',
    text: 'Qwen Distilled',
    icon: 'deepseek',
    provider: [
      provider('deepseek-r1-distill-qwen-32b', 'groq'),
      provider('deepseek/deepseek-r1-distill-qwen-32b', 'openrouter')
    ]
  },
  'gemini-2.5-pro': {
    capabilities: ['reasoning', 'toolUsage', 'imageInput'],
    name: 'Gemini 2.5 Pro',
    icon: 'google',
    provider: provider('google/gemini-2.5-pro-preview', 'openrouter')
  },
  'gemini-2.5-flash': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Gemini 2.5 Flash',
    icon: 'google',
    provider: provider('google/gemini-2.5-flash-preview', 'openrouter')
  },
  'gemini-2.5-flash-thinking': {
    capabilities: ['toolUsage', 'reasoning', 'effortControl', 'imageInput'],
    name: 'Gemini 2.5 Flash',
    text: 'Thinking',
    icon: 'google',
    provider: provider('google/gemini-2.5-flash-preview:thinking', 'openrouter')
  },
  'gemini-2.0-flash': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Gemini 2.0 Flash',
    icon: 'google',
    provider: provider('google/gemini-2.0-flash-001', 'openrouter')
  }
} as const satisfies Record<string, ModelInfo>);
