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
  temperature: tool({
    description: "Get the temperature in a location (in Celsius)",
    parameters: z.object({
      location: z
      .string()
      .describe("The location to get the temperature for"),
    }),
    execute: async({ location }) => ({
      location,
      temperature: Math.round((Math.random() * 30 + 5) * 10) / 10, // Random temp between 5°C and 35°C
    }),
  }),
} as const satisfies Record<string, CoreTool>;

export type TOOLS = typeof tools;