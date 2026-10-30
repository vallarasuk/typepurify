export interface SlidingWindowOptions<T> {
  windowMs?: number;
  keyFn?: (item: T) => string;
  maxEntries?: number;
}

interface WindowEntry {
  timestamp: number;
}

/**
 * SlidingWindowDeduplicator filters duplicate events within a rolling time window.
 */
export class SlidingWindowDeduplicator<T = any> {
  private cache = new Map<string, WindowEntry>();
  private windowMs: number;
  private keyFn: (item: T) => string;
  private maxEntries: number;

  constructor(options: SlidingWindowOptions<T> = {}) {
    this.windowMs = options.windowMs ?? 5000;
    this.maxEntries = options.maxEntries ?? 10000;
    this.keyFn =
      options.keyFn ??
      ((item: T) =>
        typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item));
  }

  /**
   * Evaluates if an item is a duplicate within the current sliding window.
   * If not duplicate, records the timestamp and returns false.
   */
  isDuplicate(item: T, now: number = Date.now()): boolean {
    const key = this.keyFn(item);
    const existing = this.cache.get(key);

    if (existing && now - existing.timestamp <= this.windowMs) {
      return true;
    }

    if (this.cache.size >= this.maxEntries) {
      this.purgeExpired(now);
      if (this.cache.size >= this.maxEntries) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { timestamp: now });
    return false;
  }

  /**
   * Filters an array of items, retaining only the first occurrence within the window.
   */
  filterDuplicates(items: T[], now: number = Date.now()): T[] {
    return items.filter((item) => !this.isDuplicate(item, now));
  }

  purgeExpired(now: number = Date.now()): number {
    let purged = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.windowMs) {
        this.cache.delete(key);
        purged++;
      }
    }
    return purged;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
