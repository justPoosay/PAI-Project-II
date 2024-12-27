import type { Model } from "./index";
import { ModelSchema } from "./schemas.ts";

export interface ModelInfo {
  supportsTools: boolean;
  name: string;
  logoSrc: string;
}

/** @description general model info, useful for both front-end and back-end */
export const modelInfo = {
  "gpt-4o": {
    supportsTools: true,
    name: "GPT-4o",
    logoSrc: "/img/openai.svg",
  },
  "gpt-4o-mini": {
    supportsTools: true,
    name: "GPT-4o Mini",
    logoSrc: "/img/openai.svg",
  },
  "claude-3-5-sonnet": {
    supportsTools: true,
    name: "Claude 3.5 Sonnet",
    logoSrc: "/img/anthropic.svg",
  },
  "grok-beta": {
    supportsTools: true,
    name: "Grok Beta",
    logoSrc: "/img/xai.svg",
  },
  "grok-2": {
    supportsTools: true,
    name: "Grok 2",
    logoSrc: "/img/xai.svg",
  },
  "llama-3.3-70b-versatile": {
    supportsTools: true,
    name: "Llama 3.3 70b Versatile",
    logoSrc: "/img/meta.svg",
  },
  "mixtral-8x7b-32768": {
    supportsTools: true,
    name: "Mixtral 8x7b 32768",
    logoSrc: "/img/mistral-ai.svg",
  }
} as const satisfies Record<Model, ModelInfo>;

export const modelArray = ModelSchema.options;