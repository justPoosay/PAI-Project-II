import { type CoreTool } from "ai";
import weather from "./impl/weather.ts";
import scrape from "./impl/scrape.ts";
import search from "./impl/search.ts";
import logger from "../../lib/logger.ts";

export interface Tool {
  core: CoreTool;
  
  /** Returns false if the tool is not available */
  dependency(): Promise<boolean> | boolean;
}

export const tools = {
  weather,
  scrape,
  search
} as const satisfies Record<string, Tool>;

const toolEntries = await Promise.all(
  Object.entries(tools).map(async([name, { core, dependency }]): Promise<[string, CoreTool] | null> => {
    const isAvailable = await dependency();
    if (!isAvailable) logger.warn(`Tool ${name} is not available`);
    return isAvailable ? [name, core] : null;
  })
);

export default Object.fromEntries(toolEntries.filter((entry): entry is [string, CoreTool] => entry !== null));