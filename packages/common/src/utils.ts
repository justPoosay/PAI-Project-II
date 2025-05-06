export type Merge<T, U> = Omit<T, keyof U> & U;
export type Nullish<T> = T | null | undefined;

export type EnhancedOmit<T, K extends keyof T> = string extends keyof T
  ? T // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : T extends any
    ? Pick<T, Exclude<keyof T, K>>
    : never;

export type Entry<T extends object> = NonNullable<{ [K in keyof T]: [K, T[K]] }[keyof T]>;
export function entries<T extends object>(obj: Nullish<T>): Entry<T>[] {
  if (!obj) return [];
  return Object.entries(obj) as Entry<T>[];
}

export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
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
