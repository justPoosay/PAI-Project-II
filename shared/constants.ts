import type { Model } from "./index";
import { ModelSchema } from "./schemas.ts";

export const defaultModel: Model = "gpt-4o";

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
    logoSrc: "/img/openai-white-logomark.svg",
  },
  "gpt-4o-mini": {
    supportsTools: true,
    name: "GPT-4o Mini",
    logoSrc: "/img/openai-white-logomark.svg",
  },
  "claude-3-5-sonnet": {
    supportsTools: true,
    name: "Claude 3.5 Sonnet",
    logoSrc: "/img/anthropic.svg",
  },
} as const satisfies Record<Model, ModelInfo>;

export const modelArray = ModelSchema.options.map((option) => option.value);