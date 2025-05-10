export class Lru<Key extends PropertyKey, Value> {
  private readonly capacity: number;
  private readonly cache: Map<Key, Value>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  private setMostRecentlyUsed(key: Key, value: Value) {
    this.cache.delete(key);
    this.cache.set(key, value);
  }

  public get(key: Key) {
    const value = this.cache.get(key);

    if (value === undefined) {
      return undefined;
    }

    this.setMostRecentlyUsed(key, value);

    return value;
  }

  public set(key: Key, value: Value) {
    this.setMostRecentlyUsed(key, value);

    if (this.cache.size > this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
  }

  public delete(key: Key) {
    this.cache.delete(key);
  }
}
