export interface CacheOptions {
  /** Time to live in milliseconds. Default: 60000 (1 minute) */
  ttl?: number;
  /** Maximum number of items the cache can hold. Default: 1000 */
  maxSize?: number;
}

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

/**
 * A simple in-memory REST API cache with TTL and LRU eviction.
 */
export class Cache<T = any> {
  private store: Map<string, CacheItem<T>> = new Map();
  private ttl: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? 60000;
    this.maxSize = options.maxSize ?? 1000;
  }

  /**
   * Retrieves a value from the cache.
   * If the item is expired, it is removed and undefined is returned.
   * If the item is valid, it is refreshed as the most recently used (LRU bump).
   */
  get(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // LRU bump: delete and re-insert to move to the end of the Map (most recently used)
    this.store.delete(key);
    this.store.set(key, item);

    return item.value;
  }

  /**
   * Sets a value in the cache.
   * If the cache exceeds maxSize, the least recently used item is evicted.
   */
  set(key: string, value: T, customTtl?: number): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      // Evict least recently used (the first item in the Map)
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) {
        this.store.delete(firstKey);
      }
    }

    // If it already exists, setting it will update it but might not move it to the end in all engines.
    // To be safe for LRU, delete it first.
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    const expiresAt = Date.now() + (customTtl ?? this.ttl);
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Deletes a specific key from the cache.
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Returns the current number of items in the cache.
   */
  get size(): number {
    return this.store.size;
  }
}
