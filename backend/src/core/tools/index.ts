import { type CoreTool } from "ai";
import weather from "./impl/weather.ts";
import scrape from "./impl/scrape.ts";
import search from "./impl/search.ts";
import logger from "../../lib/logger.ts";

export interface Tool {
  core: CoreTool;
  
  /** Returns null if the tool is available, otherwise returns an error message */
  dependency(): (string | null) | Promise<string | null>;
}

export const tools = {
  weather,
  scrape,
  search
} as const satisfies Record<string, Tool>;

const toolEntries = await Promise.all(
  Object.entries(tools).map(async([name, { core, dependency }]): Promise<[string, CoreTool] | null> => {
    const error = await dependency();
    if (error) logger.warn(`"${name}" tool is not available! Error: ${error}`);
    return error ? null : [name, core];
  })
);

export default Object.fromEntries(toolEntries.filter((entry): entry is [string, CoreTool] => entry !== null));