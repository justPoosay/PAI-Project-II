import { type Tool as CoreTool } from 'ai';
import { entries } from 'common/utils';
import { logger } from '../../lib/logger';
import { contents } from './impl/contents';
import { repo_file, repo_tree } from './impl/github';
import { search } from './impl/search';
import { weather } from './impl/weather';

export interface Tool {
  core: CoreTool;

  /** Returns null if the tool is available, otherwise returns an error message */
  dependency(): (string | null) | Promise<string | null>;
}

const toolEntries = await Promise.all(
  entries({
    weather,
    contents,
    search,
    repo_tree,
    repo_file
  }).map(async ([name, { core, dependency }]) => {
    const error = await dependency();
    if (error) logger.warn(`"${name}" tool is not available! Error: ${error}`);
    return error ? null : ([name, core] as const);
  })
);

export const tools = Object.fromEntries(toolEntries.filter(entry => entry !== null));
