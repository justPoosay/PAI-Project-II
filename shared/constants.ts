import type { ClientBoundWebSocketMessage, Model } from "./index";

export interface ModelInfo {
  toolUsage: boolean;
  imageInput: boolean;
  name: string;
  logoSrc: string;
  description: string | null;
}

/** @description general model info, useful for both front-end and back-end */
export const modelInfo = {
  "claude-3-5-sonnet": {
    toolUsage: true,
    imageInput: true,
    name: "Claude 3.5 Sonnet",
    logoSrc: "/img/anthropic.svg",
    description: "Anthropic's latest model, excelling at detailed analysis and precise responses. Especially good at code and math.",
  },
  "gpt-4o": {
    toolUsage: true,
    imageInput: true,
    name: "ChatGPT 4o",
    logoSrc: "/img/openai.svg",
    description: "OpenAI's flagship model. Excellent general-purpose model. Relatively fast."
  },
  "gpt-4o-mini": {
    toolUsage: true,
    imageInput: true,
    name: "ChatGPT 4o Mini",
    logoSrc: "/img/openai.svg",
    description: "A smaller, faster version of GPT-4. Pretty good at general tasks and coding."
  },
  "grok-2": {
    toolUsage: true,
    imageInput: false,
    name: "Grok 2",
    logoSrc: "/img/xai.svg",
    description: null
  },
  "grok-beta": {
    toolUsage: true,
    imageInput: false,
    name: "Grok Beta",
    logoSrc: "/img/xai.svg",
    description: null
  },
  "llama-3.3-70b-versatile": {
    toolUsage: true,
    imageInput: false,
    name: "Llama 3.3 70b",
    logoSrc: "/img/meta.svg",
    description: "Extremely fast open-source model running on Groq hardware. Great for quick responses and coding tasks. Not as accurate as Claude or GPT-4o."
  },
  "mixtral-8x7b-32768": {
    toolUsage: true,
    imageInput: false,
    name: "Mixtral 8x7b",
    logoSrc: "/img/mistral.svg",
    description: null
  }
} as const satisfies Record<Model, ModelInfo>;

export const errorMessageRegex = /^> \[!ERROR\]\n> \*\*(?<title>.+)\*\*\n> (?<message>.+)$/;
export const errorMessage = (error: Omit<Extract<ClientBoundWebSocketMessage, { role: "error" }>, "role">) => `> [!ERROR]
> **${error.title}**
> ${error.message}`;