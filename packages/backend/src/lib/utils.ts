import { type } from 'arktype';
import { color } from 'bun';
import { LogLevel } from '~/lib/schemas';

export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const copy = { ...obj };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const copy = {} as Pick<T, K>;
  for (const key of keys) {
    copy[key] = obj[key];
  }
  return copy;
}

export const Env = type({
  DATABASE_URL: 'string',

  'OPENAI_API_KEY?': 'string',
  'ANTHROPIC_API_KEY?': 'string',
  'XAI_API_KEY?': 'string',
  'GROQ_API_KEY?': 'string',

  'FIRECRAWL_API_KEY?': 'string',
  'FIRECRAWL_API_URL?': 'string',
  'WEATHER_API_KEY?': 'string',
  'SERP_API_KEY?': 'string',

  'GITHUB_PAT?': 'string',

  LOG_LEVEL: LogLevel.default('info')
});

const out = Env(Bun.env);

if (out instanceof type.errors) {
  console.error(`${color('#e81747', 'ansi')}[ENV] ${out.summary}${color('white', 'ansi')}`);
  process.exit(1);
}

export const env = out;
