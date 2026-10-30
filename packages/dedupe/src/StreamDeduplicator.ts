export interface DedupeOptions<T> {
  keyFn?: (item: T) => any;
  maxSize?: number;
}

/**
 * Stream deduplicator supporting custom key extractors and deep object deduplication.
 */
export class StreamDeduplicator<T = any> {
  private seen = new Set<any>();
  private keyFn?: (item: T) => any;
  private maxSize: number;

  constructor(options: DedupeOptions<T> = {}) {
    this.keyFn = options.keyFn;
    this.maxSize = options.maxSize ?? 10000;
  }

  isDuplicate(item: T): boolean {
    const key = this.getKey(item);
    if (this.seen.has(key)) {
      return true;
    }
    if (this.seen.size >= this.maxSize) {
      const first = this.seen.values().next().value;
      if (first !== undefined) this.seen.delete(first);
    }
    this.seen.add(key);
    return false;
  }

  dedupe(items: T[]): T[] {
    const result: T[] = [];
    const localSeen = new Set<any>();

    for (const item of items) {
      const key = this.getKey(item);
      if (!localSeen.has(key)) {
        localSeen.add(key);
        result.push(item);
      }
    }
    return result;
  }

  private getKey(item: T): any {
    if (this.keyFn) return this.keyFn(item);
    if (typeof item === 'object' && item !== null) {
      return JSON.stringify(item);
    }
    return item;
  }

  reset(): void {
    this.seen.clear();
  }
}
