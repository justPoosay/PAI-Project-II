export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const /*var*/ copy = { ...obj };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const /*var*/ copy = {} as Pick<T, K>;
  for (const key of keys) {
    copy[key] = obj[key];
  }
  return copy;
}

export function includes<T>(arr: T[] | Set<T>, item: T | (unknown & {})): boolean {
  return Array.isArray(arr) ? arr.includes(item as T) : arr.has(item as T);
}
