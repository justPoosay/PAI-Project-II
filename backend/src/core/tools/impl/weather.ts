import type { Tool } from "../index.ts";
import { tool } from "ai";
import { z } from "zod";
import { env } from "../../../lib/utils.ts";
import logger from "../../../lib/logger.ts";

const baseUrl = "https://api.weatherapi.com/v1";

export default {
  async dependency(): Promise<boolean> {
    if(!env.WEATHER_API_KEY) return false;
    const res = await fetch(`${baseUrl}/current.json?key=${env.WEATHER_API_KEY}&q=London`);
    return res.status !== 401; // Unauthorized
  },
  core: tool({
    description: "Get the weather for a location",
    parameters: z.object({
      location: z
      .string()
      .describe("The location to get the weather for"),
    }),
    async execute({ location }) {
      const res = await fetch(`${baseUrl}/current.json?key=${env.WEATHER_API_KEY!}&q=${location}`);
      const json = await res.json();
      if(!res.ok) logger.error("Encountered an error during execution of the tool", json);
      return json;
    },
  })
} satisfies Tool;