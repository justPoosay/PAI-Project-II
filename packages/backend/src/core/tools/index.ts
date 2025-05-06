import { type Tool as CoreTool } from 'ai';
import { entries } from 'common/utils';
import logger from '../../lib/logger';
import contents from './impl/contents';
import { repo_file, repo_tree } from './impl/github';
import search from './impl/search';
import weather from './impl/weather';

export interface Tool {
  core: CoreTool;

  /** Returns null if the tool is available, otherwise returns an error message */
  dependency(): (string | null) | Promise<string | null>;
}

export const tools = Object.freeze({
  weather,
  contents,
  search,
  repo_tree,
  repo_file
} satisfies Record<string, Tool>);

const toolEntries = await Promise.all(
  entries(tools).map(async ([name, { core, dependency }]): Promise<[string, CoreTool] | null> => {
    const error = await dependency();
    if (error) logger.warn(`"${name}" tool is not available! Error: ${error}`);
    return error ? null : [name, core];
  })
);

export default Object.fromEntries(
  toolEntries.filter((entry): entry is [string, CoreTool] => entry !== null)
);
