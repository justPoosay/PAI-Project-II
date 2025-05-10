import { tool } from 'ai';
import Exa from 'exa-js';
import { z } from 'zod';
import type { Tool } from '..';
import { env } from '../../../lib/env';

export const contents = {
  dependency: () => (env.EXA_API_KEY ? null : 'Missing EXA_API_KEY'),
  core: tool({
    description: 'Returns the contents of a webpage',
    parameters: z.object({
      url: z.string().describe('The url to scrape')
    }),
    async execute({ url }) {
      const exa = new Exa(env.EXA_API_KEY!);

      const { results } = await exa.getContents(url, {});

      return results.map(({ title, url, text }) => ({ title, url, text }));
    }
  })
} satisfies Tool;
