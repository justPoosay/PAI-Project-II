import type { Tool } from "../index.ts";
import { env } from "../../../lib/utils.ts";
import { tool } from "ai";
import { z } from "zod";
import { getJson, getAccount } from "serpapi";
import logger from "../../../lib/logger.ts";
import { search } from "../utils/search.ts";

let thirdPartySearchAPIAvailable = false;

export default {
  async dependency() {
    if(!env.SERP_API_KEY) return null;
    const account = await getAccount({ api_key: env.SERP_API_KEY });
    if(account.plan_searches_left < 1) {
      return null;
    }
    thirdPartySearchAPIAvailable = true;
    return null;
  },
  core: tool({
    description: "Search the web",
    parameters: z.object({
      query: z.string().describe("The query to search for, supports all the stuff you'd expect from a search engine"),
      engine: z.enum(["google", "bing", "duckduckgo"]).default("duckduckgo").describe("The search engine to use"),
      page: z.number().default(0).describe("The page of results to get"),
    }),
    async execute({ query, engine, page }) {
      try {
        if(thirdPartySearchAPIAvailable) {
          const result = await getJson({
            q: query,
            engine,
            api_key: env.SERP_API_KEY,
            page
          });
          return ((result?.organic_results ?? []) as any[]).map(({ title, link, snippet }) => ({
            title,
            url: link,
            snippet
          }));
        } else {
          let searchFunction = search[engine as keyof typeof search];
          if(!searchFunction) searchFunction = search.duckduckgo;
          return await searchFunction(query, page);
        }
      } catch(e) {
        if(e instanceof Error) {
          logger.error(e.message);
          return {
            success: false,
            error: e.message
          };
        }
      }
    }
  })
} satisfies Tool;