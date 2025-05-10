import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../../../core/tools';
import { env } from '../../../lib/env';
import { logger } from '../../../lib/logger';

const baseUrl = 'https://api.weatherapi.com/v1';

export const weather = {
  async dependency() {
    if (!env.WEATHER_API_KEY) return 'Missing WEATHER_API_KEY';
    const res = await fetch(`${baseUrl}/current.json?key=${env.WEATHER_API_KEY}&q=London`);
    return res.status === 401 ? 'Invalid WEATHER_API_KEY' : null;
  },
  core: tool({
    description: 'Get the weather for a location',
    parameters: z.object({
      location: z.string().describe('The location to get the weather for')
    }),
    async execute({ location }) {
      const res = await fetch(`${baseUrl}/current.json?key=${env.WEATHER_API_KEY!}&q=${location}`);
      const json = await res.json();
      if (!res.ok) logger.error('Encountered an error during execution of the tool', json);
      return json;
    }
  })
} satisfies Tool;
