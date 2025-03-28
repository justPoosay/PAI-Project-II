export class AsyncQueue<T> {
  private queue: T[] = [];
  private resolvers: ((value: T) => void)[] = [];

  enqueue(item: T): void {
    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve(item);
    } else {
      this.queue.push(item);
    }
  }

  dequeue(): Promise<T> {
    if (this.queue.length > 0) {
      const item = this.queue.shift()!;
      return Promise.resolve(item);
    }

    return new Promise<T>(resolve => {
      this.resolvers.push(resolve);
    });
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }
}
