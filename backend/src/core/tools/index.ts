import { type CoreTool, tool } from "ai";
import { z } from "zod";

export const tools = {
  eval: tool({
    description: "Evaluate a piece of JavaScript code",
    parameters: z.object({
      expression: z.string().describe("The expression to evaluate"),
    }),
    execute: async({ expression }) => ({
      expression,
      result: eval(expression),
    }),
  }),
  weather: tool({
    description: "Get the weather for a location",
    parameters: z.object({
      location: z
      .string()
      .describe("The location to get the weather for"),
    }),
    execute: async({ location }) => {
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${location}`);
      const data = await res.json();
      
      return data;
    },
  }),
} as const satisfies Record<string, CoreTool>;

export type TOOLS = typeof tools;