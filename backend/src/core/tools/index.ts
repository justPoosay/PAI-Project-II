import { type Tool as CoreTool } from "ai";
import logger from "~/lib/logger";
import weather from "~/core/tools/impl/weather";
import scrape from "~/core/tools/impl/scrape";
import search from "~/core/tools/impl/search";
import { repo_file, repo_tree } from "~/core/tools/impl/github";

export interface Tool {
  core: CoreTool;

  /** Returns null if the tool is available, otherwise returns an error message */
  dependency(): (string | null) | Promise<string | null>;
}

export const tools = {
  weather,
  scrape,
  search,
  repo_tree,
  repo_file,
} as const satisfies Record<string, Tool>;

const toolEntries = await Promise.all(
  Object.entries(tools).map(async ([name, { core, dependency }]): Promise<[string, CoreTool] | null> => {
    const error = await dependency();
    if (error) logger.warn(`"${name}" tool is not available! Error: ${error}`);
    return error ? null : [name, core];
  })
);

export default Object.fromEntries(toolEntries.filter((entry): entry is [string, CoreTool] => entry !== null));
