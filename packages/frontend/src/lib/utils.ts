import type { Nullish } from '@/lib/types';
import { models, type Model, type ModelInfo } from 'common';
import SuperJSON from 'superjson';

// eslint-disable-next-line
export function safeParse<T = any, F = null>(str: Nullish<string>, fallback = null as F): T | F {
  if (!str) return fallback;
  try {
    return SuperJSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function calculateHash(buffer: ArrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const array = Array.from(new Uint8Array(hash));
  const hex = array.map(b => b.toString(16).padStart(2, '0')).join('');
  const base64 = btoa(String.fromCharCode(...array));
  return { hex, base64 };
}

export const modelFullName = (model: typeof Model.infer) =>
  models[model].name +
  ((models[model] as ModelInfo).text ? ` (${(models[model] as ModelInfo).text})` : '');

export const selfOrFirst = <T>(it: T | T[]) => (Array.isArray(it) ? it[0] : it);
