import type { Tool } from "../index.ts";
import { env } from "../../../lib/utils.ts";
import { tool } from "ai";
import { z } from "zod";
import { getJson, getAccount } from "serpapi";
import logger from "../../../lib/logger.ts";

export default {
  async dependency() {
    if(!env.SERP_API_KEY) return "Missing SERP_API_KEY";
    const account = await getAccount({ api_key: env.SERP_API_KEY });
    if(account.plan_searches_left < 1) {
      return "Account has no searches left";
    }
    return null;
  },
  core: tool({
    description: "Search the web",
    parameters: z.object({
      query: z.string().describe("The query to search for, supports all the stuff you'd expect from a search engine"),
      engine: z.enum(["google", "bing", "duckduckgo"]).default("google").describe("The search engine to use"),
      start: z.number().default(0).describe("Result offset"),
    }),
    async execute({ query, engine, start }) {
      try {
        const result = await getJson({
          q: query,
          engine,
          api_key: env.SERP_API_KEY,
          start
        });
        return ((result?.organic_results ?? []) as any[]).map(({ title, link, snippet }) => ({ title, link, snippet }));
      } catch(e) {
        if(e instanceof Error) {
          logger.error(e.message);
          return e.message;
        }
      }
    }
  })
} satisfies Tool;