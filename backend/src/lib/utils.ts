import { z } from "zod";
import { LogLevelSchema } from "./logger.ts";

export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch(e) {
    return false;
  }
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const copy = { ...obj };
  for(const key of keys) {
    delete copy[key];
  }
  return copy;
}

export const env = z.object({
  DATABASE_URL: z.string(),
  
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  
  FIRECRAWL_API_KEY: z.string().optional(),
  FIRECRAWL_API_URL: z.string().optional(),
  
  WEATHER_API_KEY: z.string().optional(),
  
  SEARCH_API_KEY: z.string().optional(),
  
  LOG_LEVEL: LogLevelSchema.default("info"),
}).superRefine((data, ctx) => {
  if(!data.OPENAI_API_KEY && !data.ANTHROPIC_API_KEY && !data.XAI_API_KEY && !data.GROQ_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one of OPENAI_API_KEY, ANTHROPIC_API_KEY, XAI_API_KEY or GROQ_API_KEY must be set"
    });
  }
}).parse(process.env);