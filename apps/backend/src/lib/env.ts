import { type } from 'arktype';
import { color } from 'bun';
import { LogLevel } from './schemas';

export const Env = type({
  DATABASE_URL: 'string.url',
  VALKEY_URL: 'string.url',

  BETTER_AUTH_SECRET: 'string>8',
  BASE_URL: 'string.url',

  STRIPE_SECRET_KEY: 'string>0',
  STRIPE_WEBHOOK_SECRET: 'string>0',
  STRIPE_PRICE_ID: 'string>0',

  GITHUB_CLIENT_ID: 'string>0',
  GITHUB_CLIENT_SECRET: 'string>0',

  'OPENAI_API_KEY?': 'string',
  'ANTHROPIC_API_KEY?': 'string',
  'XAI_API_KEY?': 'string',
  'GROQ_API_KEY?': 'string',
  'OPENROUTER_API_KEY?': 'string',

  'EXA_API_KEY?': 'string',
  'WEATHER_API_KEY?': 'string',
  'GITHUB_PAT?': 'string',

  VITE_MESSAGES_PER_MONTH_FREE: 'string.numeric.parse',
  VITE_MESSAGES_PER_MONTH_PAID: 'string.numeric.parse',

  LOG_LEVEL: LogLevel
});

const out = Env(Bun.env);

if (out instanceof type.errors) {
  console.error(
    `${color('#e81747', 'ansi')}[FATAL] [.env]${out.summary.includes('\n') ? '\n' : ' '}  ${out.summary.replace(/\n/g, '\n  ')}${color('white', 'ansi')}`
  );
  process.exit(1);
} else if (
  !out.OPENAI_API_KEY &&
  !out.ANTHROPIC_API_KEY &&
  !out.XAI_API_KEY &&
  !out.GROQ_API_KEY &&
  !out.OPENROUTER_API_KEY
) {
  console.error(
    `${color('#e81747', 'ansi')}[FATAL] [.env]\n  At least one AI provider API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, XAI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY) must be set!${color('white', 'ansi')}`
  );
  process.exit(1);
}

export const env = out;
