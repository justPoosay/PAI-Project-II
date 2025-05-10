import DeepSeek from '@/components/icons/deepseek.vue';
import XAI from '@/components/icons/xai.vue';
import type { models } from 'common';
import type { DefineComponent } from 'vue';
import type { IconType } from 'vue-icons-plus/lib';
import { SiAnthropic, SiGooglegemini, SiMeta, SiOpenai } from 'vue-icons-plus/si';

export const icons = Object.freeze({
  anthropic: SiAnthropic,
  deepseek: DeepSeek,
  meta: SiMeta,
  openai: SiOpenai,
  xai: XAI,
  google: SiGooglegemini
} satisfies {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in (typeof models)[keyof typeof models]['icon']]: DefineComponent<any, any, any> | IconType;
});
