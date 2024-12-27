import { z } from "zod";
import { LogLevelSchema } from "./logger.ts";

export function isValidJSON (str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

export const env = z.object({
  DATABASE_URL: z.string(),
  OPENAI_API_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string(),
  
  FIRECRAWL_API_KEY: z.string().optional(),
  FIRECRAWL_API_URL: z.string().optional(),
  
  WEATHER_API_KEY: z.string().optional(),
  
  SEARCH_API_KEY: z.string().optional(),
  
  LOG_LEVEL: LogLevelSchema.default("info"),
}).parse(process.env);