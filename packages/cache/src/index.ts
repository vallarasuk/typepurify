export interface CacheOptions {
  /** Time to live in milliseconds. Default: 60000 (1 minute) */
  ttl?: number;
  /** Custom function to generate a cache key from the arguments. */
  keyGenerator?: (...args: any[]) => string;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Wraps an asynchronous function with an in-memory TTL cache.
 *
 * @param fn The async function to cache
 * @param options Cache options like TTL and key generator
 * @returns The wrapped cached async function
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions = {},
): T {
  const ttl = options.ttl ?? 60000;
  const cache = new Map<string, CacheEntry<any>>();

  return (async (...args: any[]) => {
    const key = options.keyGenerator ? options.keyGenerator(...args) : JSON.stringify(args);

    const now = Date.now();
    const cached = cache.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const value = await fn(...args);

    cache.set(key, {
      value,
      expiresAt: now + ttl,
    });

    return value;
  }) as unknown as T;
}
