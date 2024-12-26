import type { Model } from "./index";

export const defaultModel: Model = "gpt-4o";

export interface ModelInfo {
  supportsTools: boolean;
  name: string;
}

/** @description general model info, useful for both front-end and back-end */
export const modelInfo = {
  "gpt-4o": {
    supportsTools: true,
    name: "GPT-4o",
  },
  "gpt-4o-mini": {
    supportsTools: true,
    name: "GPT-4o Mini",
  },
  "claude-3-5-sonnet": {
    supportsTools: true,
    name: "Claude 3.5 Sonnet",
  },
} as const satisfies Record<Model, ModelInfo>;