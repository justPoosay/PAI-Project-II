import type { ClientBoundWebSocketMessage, Model } from "./index";

export interface ModelInfo {
  toolUsage: boolean;
  imageInput: boolean;
  name: string;
  logoSrc: string;
}

/** @description general model info, useful for both front-end and back-end */
export const modelInfo = {
  "gpt-4o": {
    toolUsage: true,
    imageInput: true,
    name: "GPT-4o",
    logoSrc: "/img/openai.svg",
  },
  "gpt-4o-mini": {
    toolUsage: true,
    imageInput: true,
    name: "GPT-4o Mini",
    logoSrc: "/img/openai.svg",
  },
  "claude-3-5-sonnet": {
    toolUsage: true,
    imageInput: true,
    name: "Claude 3.5 Sonnet",
    logoSrc: "/img/anthropic.svg",
  },
  "grok-2": {
    toolUsage: true,
    imageInput: false,
    name: "Grok 2",
    logoSrc: "/img/xai.svg",
  },
  "grok-beta": {
    toolUsage: true,
    imageInput: false,
    name: "Grok Beta",
    logoSrc: "/img/xai.svg",
  },
  "llama-3.3-70b-versatile": {
    toolUsage: true,
    imageInput: false,
    name: "Llama 3.3 70b Versatile",
    logoSrc: "/img/meta.svg",
  },
  "mixtral-8x7b-32768": {
    toolUsage: true,
    imageInput: false,
    name: "Mixtral 8x7b 32768",
    logoSrc: "/img/mistral.svg",
  }
} as const satisfies Record<Model, ModelInfo>;

export const errorMessageRegex = /^> \[!ERROR\]\n> \*\*(?<title>.+)\*\*\n> (?<message>.+)$/;
export const errorMessage = (error: Omit<Extract<ClientBoundWebSocketMessage, { role: "error" }>, "role">) => `> [!ERROR]
> **${error.title}**
> ${error.message}`