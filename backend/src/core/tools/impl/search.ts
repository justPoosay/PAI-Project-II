import type { Tool } from "../index.ts";
import { env } from "../../../lib/utils.ts";
import { tool } from "ai";
import { z } from "zod";

const baseUrl = "https://www.searchapi.io/api/v1";

export default {
  async dependency(): Promise<boolean> {
    if(!env.SEARCH_API_KEY) return false;
    const res = await fetch(`${baseUrl}/me?api_key=${env.SEARCH_API_KEY}`);
    if(!res.ok) return false;
    const json = await res.json();
    return json.remaining_credits > 0;
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
      return await res.json();
    }
  })
} satisfies Tool;