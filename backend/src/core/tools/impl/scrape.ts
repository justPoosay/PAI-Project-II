import type { Tool } from "../index.ts";
import { tool } from "ai";
import { z } from "zod";
import FirecrawlApp from "@mendable/firecrawl-js";
import { env } from "../../../lib/utils.ts";
import logger from "../../../lib/logger.ts";

export default {
  dependency() {
    const available = !!env.FIRECRAWL_API_URL || !!env.FIRECRAWL_API_KEY;
    return available ? null : "Missing FIRECRAWL_API_URL or FIRECRAWL_API_KEY";
  },
  core: tool({
    description: "Get website's content",
    parameters: z.object({
      url: z.string().describe("The url to scrape"),
    }),
    async execute({ url }) {
      const app = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY, apiUrl: env.FIRECRAWL_API_URL });
      try {
        return await app.scrapeUrl(url, { formats: ["markdown"] });
      } catch(e: any) {
        logger.error("Encountered an error during execution of the tool", e);
        return {
          succes: false,
          error: e.message
        };
      }
    }
  })
} satisfies Tool;