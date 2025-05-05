import { anthropic } from '@ai-sdk/anthropic';
import { groq } from '@ai-sdk/groq';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import type { LanguageModelV1 } from 'ai';

export interface ModelInfo {
  capabilities: Array<'toolUsage' | 'imageInput' | 'reasoning' | 'effortControl' | (string & {})>;
  name: string;
  text?: string;
  icon: string;
  description?: string;
  provider: {
    it: LanguageModelV1;
    env: string;
  };
  options?: Record<string, string[]>;
}

export const models = Object.freeze({
  'o4-mini': {
    capabilities: ['toolUsage', 'reasoning', 'imageInput', 'effortControl'],
    name: 'o4-mini',
    icon: 'openai',
    provider: {
      it: openai('o4-mini'),
      env: 'OPENAI_API_KEY'
    }
  },
  'o3-mini': {
    capabilities: ['toolUsage', 'reasoning', 'effortControl'],
    name: 'o3-mini',
    icon: 'openai',
    provider: {
      it: openai('o3-mini'),
      env: 'OPENAI_API_KEY'
    }
  },
  'claude-3-5-sonnet': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Claude 3.5 Sonnet',
    icon: 'anthropic',
    provider: {
      it: anthropic('claude-3-5-sonnet-latest'),
      env: 'ANTHROPIC_API_KEY'
    }
  },
  'claude-3-7-sonnet': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Claude 3.7 Sonnet',
    icon: 'anthropic',
    provider: {
      it: anthropic('claude-3-7-sonnet-20250219'),
      env: 'ANTHROPIC_API_KEY'
    }
  },
  'claude-3-7-sonnet-thinking': {
    capabilities: ['toolUsage', 'reasoning', 'effortControl'],
    name: 'Claude 3.7 Sonnet',
    text: 'Thinking',
    icon: 'anthropic',
    provider: {
      it: anthropic('claude-3-7-sonnet-20250219'),
      env: 'ANTHROPIC_API_KEY'
    }
  },
  'gpt-4.1': {
    capabilities: ['imageInput'],
    name: 'GPT 4.1',
    icon: 'openai',
    provider: {
      it: openai('gpt-4.1'),
      env: 'OPENAI_API_KEY'
    }
  },
  'gpt-4.1-mini': {
    capabilities: ['imageInput'],
    name: 'GPT 4.1 Mini',
    icon: 'openai',
    provider: {
      it: openai('gpt-4.1-mini'),
      env: 'OPENAI_API_KEY'
    }
  },
  'gpt-4o': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'GPT 4o',
    icon: 'openai',
    provider: {
      it: openai('gpt-4o'),
      env: 'OPENAI_API_KEY'
    }
  },
  'gpt-4o-mini': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'GPT 4o Mini',
    icon: 'openai',
    provider: {
      it: openai('gpt-4o-mini'),
      env: 'OPENAI_API_KEY'
    }
  },
  'grok-3': {
    capabilities: ['toolUsage'],
    name: 'Grok 3',
    icon: 'xai',
    provider: {
      it: xai('grok-3'),
      env: 'XAI_API_KEY'
    }
  },
  'llama-3.3-70b-versatile': {
    capabilities: ['toolUsage'],
    name: 'Llama 3.3 70b',
    icon: 'meta',
    provider: {
      it: groq('llama-3.3-70b-versatile'),
      env: 'GROQ_API_KEY'
    }
  },
  'deepseek-r1-distill-llama-70b': {
    capabilities: ['toolUsage', 'reasoning'],
    name: 'DeepSeek R1',
    text: 'Llama Distilled',
    icon: 'deepseek',
    provider: {
      it: groq('deepseek-r1-distill-llama-70b'),
      env: 'GROQ_API_KEY'
    }
  },
  'deepseek-r1-distill-qwen-32b': {
    capabilities: ['toolUsage', 'reasoning'],
    name: 'DeepSeek R1',
    text: 'Qwen Distilled',
    icon: 'deepseek',
    provider: {
      it: groq('deepseek-r1-distill-qwen-32b'),
      env: 'GROQ_API_KEY'
    }
  },
  'gemini-2.5-pro': {
    capabilities: ['reasoning', 'toolUsage', 'imageInput'],
    name: 'Gemini 2.5 Pro',
    icon: 'google',
    provider: {
      it: openrouter('google/gemini-2.5-pro-preview-03-25'),
      env: 'OPENROUTER_API_KEY'
    }
  },
  'gemini-2.5-flash': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Gemini 2.5 Flash',
    icon: 'google',
    provider: {
      it: openrouter('google/gemini-2.5-flash-preview'),
      env: 'OPENROUTER_API_KEY'
    }
  },
  'gemini-2.5-flash-thinking': {
    capabilities: ['toolUsage', 'reasoning', 'effortControl', 'imageInput'],
    name: 'Gemini 2.5 Flash',
    text: 'Thinking',
    icon: 'google',
    provider: {
      it: openrouter('google/gemini-2.5-flash-preview:thinking'),
      env: 'OPENROUTER_API_KEY'
    }
  },
  'gemini-2.0-flash': {
    capabilities: ['toolUsage', 'imageInput'],
    name: 'Gemini 2.0 Flash',
    icon: 'google',
    provider: {
      it: openrouter('google/gemini-2.0-flash-001'),
      env: 'OPENROUTER_API_KEY'
    }
  }
} as const satisfies Record<string, ModelInfo>);
