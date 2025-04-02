import { tool } from 'ai';
import { getAccount, getJson } from 'serpapi';
import { z } from 'zod';
import type { Tool } from '../../../core/tools';
import { search } from '../../../core/tools/utils/search';
import logger from '../../../lib/logger';
import { env } from '../../../lib/utils';

let thirdPartySearchAPIAvailable = false;

export default {
  async dependency() {
    if (!env.SERP_API_KEY) return null;
    const account = await getAccount({ api_key: env.SERP_API_KEY });
    if (account.plan_searches_left < 1) {
      return null;
    }
    thirdPartySearchAPIAvailable = true;
    return null;
  },
  core: tool({
    description: 'Search the web',
    parameters: z.object({
      query: z
        .string()
        .describe(
          "The query to search for, supports all the stuff you'd expect from a search engine"
        ),
      engine: z
        .enum(['google', 'bing', 'duckduckgo'])
        .default('duckduckgo')
        .describe('The search engine to use'),
      page: z.number().default(0).describe('The page of results to get')
    }),
    async execute({ query, engine, page }) {
      try {
        if (thirdPartySearchAPIAvailable) {
          const result = await getJson({
            q: query,
            engine,
            api_key: env.SERP_API_KEY,
            page
          });
          return ((result?.organic_results ?? []) as { [key: string]: unknown }[]).map(
            ({ title, link, snippet }) => ({
              title,
              link,
              snippet
            })
          );
        } else {
          return await (search[engine] ?? search.duckduckgo)(query, page);
        }
      } catch (e) {
        if (e instanceof Error) {
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
