import type { Tool } from "../index.ts";
import { tool } from "ai";
import { z } from "zod";
import FirecrawlApp from "@mendable/firecrawl-js";
import { env } from "../../../lib/utils.ts";

export default {
  dependency(): boolean {
    return !!env.FIRECRAWL_API_URL || !!env.FIRECRAWL_API_KEY;
  },
  core: tool({
    description: "Get website's content",
    parameters: z.object({
      url: z
      .string()
      .describe("The url to scrape"),
      format: z.enum(["markdown", "html"]).default("markdown").describe("The format to return the content in")
    }),
    async execute({ url, format }) {
      const app = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY, apiUrl: env.FIRECRAWL_API_URL });
      try {
        return app.scrapeUrl(url, { formats: [format] });
      } catch(e: any) {
        return e.message;
      }
    }
  })
} satisfies Tool;