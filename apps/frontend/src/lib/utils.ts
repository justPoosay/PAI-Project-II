import { models, type Model, type ModelInfo } from 'common';

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

export const modelFullName = (model: Model) =>
  models[model].name +
  ((models[model] as ModelInfo).text ? ` (${(models[model] as ModelInfo).text})` : '');

export const selfOrFirst = <T>(it: T | T[]) => (Array.isArray(it) ? it[0]! : it);

export const setTheme = (theme: 'light' | 'dark' | 'system') => {
  document.documentElement.classList.toggle(
    'dark',
    theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
};
