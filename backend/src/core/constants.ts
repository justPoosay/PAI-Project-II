import type { LanguageModelV1 } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import type { Model as TModel } from "../../../shared";
import { type ModelInfo, modelInfo } from "../../../shared/constants.ts";
import { xai } from "@ai-sdk/xai";

type Model = ModelInfo & {
  model: LanguageModelV1;
}

/** @description model info, useful only for back-end */
export const models = {
  "gpt-4o": {
    ...modelInfo["gpt-4o"],
    model: openai("gpt-4o"),
  },
  "gpt-4o-mini": {
    ...modelInfo["gpt-4o-mini"],
    model: openai("gpt-4o-mini"),
  },
  "claude-3-5-sonnet": {
    ...modelInfo["claude-3-5-sonnet"],
    model: anthropic("claude-3-5-sonnet-latest"),
  },
  "grok-beta": {
    ...modelInfo["grok-beta"],
    model: xai("grok-beta"),
  },
  "grok-2": {
    ...modelInfo["grok-2"],
    model: xai("grok-2"),
  }
} as const satisfies Record<TModel, Model>;