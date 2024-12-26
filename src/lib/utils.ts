export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch(e) {
    return false;
  }
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const copy = { ...obj };
  for(const key of keys) {
    delete copy[key];
  }
  return copy;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}