export interface CacheOptions {
  /** Time to live in milliseconds. Default: 60000 (1 minute) */
  ttl?: number;
  /** Maximum number of items the cache can hold. Default: 1000 */
  maxSize?: number;
  /** Callback fired when a cache hit occurs */
  onCacheHit?: (key: string) => void;
  /** Callback fired when a cache miss occurs */
  onCacheMiss?: (key: string) => void;
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
  private onCacheHit?: (key: string) => void;
  private onCacheMiss?: (key: string) => void;
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? 60000;
    this.maxSize = options.maxSize ?? 1000;
    this.onCacheHit = options.onCacheHit;
    this.onCacheMiss = options.onCacheMiss;
  }

  /**
   * Retrieves a value from the cache.
   * If the item is expired, it is removed and undefined is returned.
   * If the item is valid, it is refreshed as the most recently used (LRU bump).
   */
  get(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) {
      this.onCacheMiss?.(key);
      return undefined;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.onCacheMiss?.(key);
      return undefined;
    }

    // LRU bump: delete and re-insert to move to the end of the Map (most recently used)
    this.store.delete(key);
    this.store.set(key, item);

    this.onCacheHit?.(key);
    return item.value;
  }

  /**
   * Retrieves a value from the cache. If it doesn't exist or is expired,
   * it executes the provided factory function, caches the result, and returns it.
   */
  async getOrSet(key: string, factory: () => Promise<T> | T, customTtl?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const value = await factory();
    this.set(key, value, customTtl);
    return value;
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
   * Deletes all keys matching a specific pattern.
   */
  deletePattern(pattern: RegExp): void {
    for (const key of this.store.keys()) {
      if (pattern.test(key)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Manually evicts all expired items from the cache.
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Returns the current number of items in the cache.
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Starts a background interval to sweep expired items periodically.
   */
  startCleanupInterval(ms: number = 60000): void {
    this.stopCleanupInterval();
    this.cleanupInterval = setInterval(() => {
      this.clearExpired();
    }, ms);
  }

  /**
   * Stops the background cleanup interval.
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
}

/**
 * Wraps an async function with an automatic caching layer.
 *
 * @param fn The async function to wrap.
 * @param options Cache options (ttl, maxSize, etc).
 * @param keyBuilder Optional custom key generator based on arguments.
 * @returns A cached version of the async function.
 */
export function withCache<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: CacheOptions = {},
  keyBuilder: (...args: Args) => string = (...args) => JSON.stringify(args),
): (...args: Args) => Promise<T> {
  const cache = new Cache<T>(options);

  const wrapped = async (...args: Args): Promise<T> => {
    const key = keyBuilder(...args);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    const result = await fn(...args);
    cache.set(key, result);
    return result;
  };

  // Expose the cache instance for manual operations (e.g. invalidation)
  (wrapped as any).cache = cache;
  return wrapped;
}

/**
 * Revalidates the TTL engine cache entries proactively before expiration.
 */
export class TTLEngine {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  set(key: string, value: any, ttlMs: number) {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  revalidate(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    // Extend TTL by another standard window
    entry.expiresAt = Date.now() + 60000;
    return true;
  }
}

/**
 * Sliding window cache that extends entry TTL on every successful read access.
 */
export class SlidingWindowCache<K, V> {
  private store = new Map<K, { value: V; expiresAt: number }>();

  constructor(private windowMs: number) {}

  set(key: K, value: V): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.windowMs });
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    entry.expiresAt = Date.now() + this.windowMs;
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }
}
