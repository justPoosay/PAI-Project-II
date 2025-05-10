import { tool } from 'ai';
import Exa from 'exa-js';
import { literal, number, object, string, union } from 'zod';
import type { Tool } from '../../../core/tools';
import { env } from '../../../lib/env';

export const search = {
  dependency: () => (env.EXA_API_KEY ? null : 'Missing EXA_API_KEY'),
  core: tool({
    description: 'Search the web',
    parameters: object({
      query: string().describe('The query'),
      category: union([
        literal('company'),
        literal('research paper'),
        literal('news'),
        literal('pdf'),
        literal('github'),
        literal('tweet'),
        literal('personal site'),
        literal('linkedin profile'),
        literal('financial report')
      ])
        .describe('Result category')
        .optional(),
      numResults: number().min(1).max(100).default(10).describe('Number of results')
    }),
    async execute({ query, category, numResults }) {
      const exa = new Exa(env.EXA_API_KEY!);

      const { results } = await exa.search(query, {
        type: 'auto',
        category,
        numResults
      });

      return results.map(({ title, url, publishedDate, score }) => ({
        title,
        url,
        publishedDate,
        score
      }));
    }
  })
} satisfies Tool;
