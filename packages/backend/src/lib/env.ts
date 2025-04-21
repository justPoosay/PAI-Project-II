import { type } from 'arktype';
import { color } from 'bun';
import { LogLevel } from './schemas';

export const Env = type({
  DATABASE_URL: 'string',

  BETTER_AUTH_SECRET: 'string>8',
  BETTER_AUTH_URL: 'string.url',

  GITHUB_CLIENT_ID: 'string>0',
  GITHUB_CLIENT_SECRET: 'string>0',

  'OPENAI_API_KEY?': 'string',
  'ANTHROPIC_API_KEY?': 'string',
  'XAI_API_KEY?': 'string',
  'GROQ_API_KEY?': 'string',

  'FIRECRAWL_API_KEY?': 'string',
  'FIRECRAWL_API_URL?': 'string',
  'WEATHER_API_KEY?': 'string',
  'SERP_API_KEY?': 'string',

  'GITHUB_PAT?': 'string',

  LOG_LEVEL: LogLevel
});

const out = Env(Bun.env);

if (out instanceof type.errors) {
  console.error(
    `${color('#e81747', 'ansi')}[FATAL] [.env]${out.summary.includes('\n') ? '\n' : ' '}  ${out.summary.replace(/\n/g, '\n  ')}${color('white', 'ansi')}`
  );
  process.exit(1);
}

export const env = out;
