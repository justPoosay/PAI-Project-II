import type { Tool } from "../index.ts";
import { env } from "../../../lib/utils.ts";
import { tool } from "ai";
import { z } from "zod";
import logger from "../../../lib/logger.ts";

const baseUrl = "https://www.searchapi.io/api/v1";

export default {
  async dependency() {
    if(!env.SEARCH_API_KEY) return "Missing SEARCH_API_KEY";
    const res = await fetch(`${baseUrl}/me?api_key=${env.SEARCH_API_KEY}`);
    if(!res.ok) return res.statusText;
    const json = await res.json();
    return json.remaining_credits > 0 ? null : "No remaining credits";
  },
  core: tool({
    description: "Search the web",
    parameters: z.object({
      query: z.string().describe("The query to search for, supports all the stuff you'd expect from a search engine"),
      engine: z.enum(["google", "bing", "duckduckgo"]).default("google").describe("The search engine to use"),
      num: z.number().optional().describe("The maximum number of results to return"),
      page: z.number().optional().describe("The page number to start at"),
    }),
    async execute({ query, engine, num, page }) {
      const params = new URLSearchParams({
        api_key: env.SEARCH_API_KEY!,
        q: query,
        engine,
        ...(num && { num: num.toString() }),
        ...(page && { page: page.toString() }),
      });
      const res = await fetch(`${baseUrl}/search?${params}`);
      const json = await res.json();
      if (!res.ok) logger.error("Encountered an error during execution of the tool", json);
      return json;
    }
  })
} satisfies Tool;