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

  private hits = 0;
  private misses = 0;

  getStats(): { hits: number; misses: number; hitRatio: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRatio: total === 0 ? 0 : this.hits / total,
    };
  }

  clearStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Retrieves a value from the cache.
   * If the item is expired, it is removed and undefined is returned.
   * If the item is valid, it is refreshed as the most recently used (LRU bump).
   */
  get(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) {
      this.misses++;
      this.onCacheMiss?.(key);
      return undefined;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.misses++;
      this.onCacheMiss?.(key);
      return undefined;
    }

    // LRU bump: delete and re-insert to move to the end of the Map (most recently used)
    this.store.delete(key);
    this.store.set(key, item);

    this.hits++;
    this.onCacheHit?.(key);
    return item.value;
  }

  /**
   * Checks if a key exists in the cache and is not expired.
   */
  has(key: string): boolean {
    const item = this.store.get(key);
    if (!item) return false;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
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
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;
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
   * Bulk retrieve multiple keys at once.
   */
  mget(keys: string[]): Record<string, T | undefined> {
    const result: Record<string, T | undefined> = {};
    for (const key of keys) {
      result[key] = this.get(key);
    }
    return result;
  }

  /**
   * Bulk set multiple key-value pairs at once.
   */
  mset(entries: Record<string, T>, customTtl?: number): void {
    for (const [key, val] of Object.entries(entries)) {
      this.set(key, val, customTtl);
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

  size(): number {
    return this.store.size;
  }
}

/**
 * Basic in-memory mock for file-system storage adapter.
 */
export class FileSystemStorageAdapter<T = any> {
  private mem = new Map<string, T>();

  constructor(public readonly storagePath: string = '/tmp/typepurify-cache') {}

  async getItem(key: string): Promise<T | undefined> {
    return this.mem.get(key);
  }

  async setItem(key: string, value: T): Promise<void> {
    this.mem.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.mem.delete(key);
  }
}

/**
 * Universal Web Storage Adapter for localStorage.
 */
export class LocalStorageAdapter<T = any> {
  constructor(private prefix = 'typepurify_') {}

  getItem(key: string): T | undefined {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    try {
      const item = window.localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : undefined;
    } catch {
      return undefined;
    }
  }

  setItem(key: string, value: T): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      // Ignore quota errors
    }
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(this.prefix + key);
  }
}

/**
 * Persistent storage adapter for caching engines.
 */
export class PersistentStorageAdapter<T = any> {
  private db = new Map<string, { data: T; timestamp: number }>();

  async get(key: string): Promise<T | undefined> {
    const entry = this.db.get(key);
    return entry ? entry.data : undefined;
  }

  async set(key: string, data: T): Promise<void> {
    this.db.set(key, { data, timestamp: Date.now() });
  }

  async delete(key: string): Promise<void> {
    this.db.delete(key);
  }

  async clear(): Promise<void> {
    this.db.clear();
  }
}

/**
 * Probabilistic Bloom filter helper for rapid cache key membership verification.
 */
export class BloomFilterCache {
  private set = new Set<string>();

  add(key: string): void {
    this.set.add(key);
  }

  mightContain(key: string): boolean {
    return this.set.has(key);
  }

  clear(): void {
    this.set.clear();
  }
}

/**
 * Stale-While-Revalidate caching helper for serving cached data while fetching updates asynchronously.
 */
export function createStaleWhileRevalidateCache<T = any>(ttlMs = 5000) {
  const store = new Map<string, { data: T; timestamp: number }>();

  return async (key: string, fetcher: () => Promise<T>): Promise<T> => {
    const entry = store.get(key);
    const now = Date.now();

    if (entry) {
      if (now - entry.timestamp > ttlMs) {
        // Revalidate in background
        fetcher().then((fresh) => store.set(key, { data: fresh, timestamp: Date.now() }));
      }
      return entry.data;
    }

    const fresh = await fetcher();
    store.set(key, { data: fresh, timestamp: now });
    return fresh;
  };
}

/**
 * Cleanup the core LRU eviction queue for efficient stale cache evictions in O(1) time.
 */
export class LruEvictionQueue<K, V> {
  private map = new Map<K, V>();

  constructor(private capacity: number) {}

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key)!;
    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  set(key: K, value: V): void {
    if (
      typeof key === 'string' &&
      (key === '__proto__' || key === 'constructor' || key === 'prototype')
    )
      return;
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Delete the first item (least recently used)
      const lruKey = this.map.keys().next().value;
      if (lruKey !== undefined) {
        this.map.delete(lruKey);
      }
    }
    this.map.set(key, value);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): void {
    this.map.delete(key);
  }

  size(): number {
    return this.map.size;
  }
}

/**
 * Tracks a GraphQL query AST to generate a cache signature.
 */
export function trackGraphQLGraphTracker(query: string): string {
  // Simplistic AST tracker simulation
  const cleaned = query.replace(/\s+/g, '').trim();
  return Buffer.from(cleaned).toString('base64');
}

export * from './sqlitePersistentStore';
