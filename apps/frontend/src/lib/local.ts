import { type, type Type } from 'arktype';
import { Effort, Model } from 'common';
import { parse, stringify } from 'superjson';

export function fromLS<K extends keyof typeof keyToSchema>(
  key: K
): (typeof keyToSchema)[K]['inferOut'] {
  const val = localStorage.getItem(key);
  if (!val) throw new Error(`Key "${key}" not found in localStorage`);
  return keyToSchema[key].assert(parse(val));
}

export function fromLSSafe<K extends keyof typeof keyToSchema>(
  key: K
): (typeof keyToSchema)[K]['inferOut'] | null {
  try {
    return fromLS(key);
  } catch (e) {
    void e;
    return null;
  }
}

export function toLS<K extends keyof typeof keyToSchema>(
  key: K,
  value: (typeof keyToSchema)[K]['inferOut']
) {
  localStorage.setItem(key, stringify(value));
}

const keyToSchema = {
  theme: type("'dark' | 'light' | 'system'"),
  'available-models': Model.array(),
  'default-model': Model,
  'default-reasoning-effort': Effort,
  price: type({
    id: 'string',
    unitAmount: 'number',
    currency: 'string',
    interval: "'day' | 'month' | 'week' | 'year' | undefined"
  }),
  limits: type({
    messagesUsed: 'number',
    refresh: 'Date',
    tier: "'free' | 'pro'"
  }),
  'user-preferences': type({
    name: 'string',
    occupation: 'string',
    selectedTraits: 'string',
    additionalInfo: 'string'
  }),
  'system-prompt': type.string
} as const satisfies Record<string, Type<unknown, object>>;
