import type { Nullish } from "./types";

export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function isBackendAlive(): Promise<boolean> {
  const res = await fetch("/api/alive");
  return res.ok;
}

export async function calculateHash(buffer: ArrayBuffer) {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  const array = Array.from(new Uint8Array(hash));
  const hex = array.map(b => b.toString(16).padStart(2, "0")).join("");
  const base64 = btoa(String.fromCharCode(...array));
  return { hex, base64 };
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const copy = { ...obj };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
}

export function last<T>(arr: Nullish<T[]>): T | undefined {
  return arr ? arr[arr.length - 1] : undefined;
}