import { describe, it, expect } from 'vitest';
import { Cache, TTLEngine, SlidingWindowCache } from './index';

describe('@typepurify/cache', () => {
  it('should set and get values', () => {
    const cache = new Cache<string>();
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return undefined for missing keys', () => {
    const cache = new Cache();
    expect(cache.get('missing')).toBeUndefined();
    expect(cache.has('missing')).toBe(false);
  });

  it('should respect TTL and expire items', async () => {
    const cache = new Cache({ ttl: 50 });
    cache.set('key1', 'value1');

    expect(cache.get('key1')).toBe('value1');

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(cache.has('key1')).toBe(false);
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('should evict least recently used (LRU) when max size is reached', () => {
    const cache = new Cache({ maxSize: 2 });

    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size).toBe(2);

    // Adding third item should evict 'a' (oldest)
    cache.set('c', 3);
    expect(cache.size).toBe(2);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('should update LRU status on get()', () => {
    const cache = new Cache({ maxSize: 2 });

    cache.set('a', 1);
    cache.set('b', 2);

    // Access 'a', making 'b' the least recently used
    cache.get('a');

    cache.set('c', 3); // Should evict 'b'

    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });

  it('should update LRU status on set() of existing key', () => {
    const cache = new Cache({ maxSize: 2 });

    cache.set('a', 1);
    cache.set('b', 2);

    // Update 'a', making 'b' the least recently used
    cache.set('a', 11);

    cache.set('c', 3); // Should evict 'b'

    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(11);
  });

  it('should support custom TTL per item', async () => {
    const cache = new Cache({ ttl: 1000 });

    cache.set('long', 1); // 1000ms TTL
    cache.set('short', 2, 50); // 50ms TTL

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(cache.get('long')).toBe(1);
    expect(cache.get('short')).toBeUndefined();
  });

  describe('clearExpired', () => {
    it('should remove only expired items', async () => {
      const cache = new Cache({ ttl: 10 });
      cache.set('a', 1);
      cache.set('b', 2, 1000);
      await new Promise((r) => setTimeout(r, 20));
      cache.clearExpired();
      expect(cache.size).toBe(1);
      expect(cache.get('b')).toBe(2);
    });

    it('should handle deletion of non-existent keys', () => {
      const cache = new Cache();
      expect(() => cache.delete('non-existent')).not.toThrow();
    });
  });

  describe('deletePattern', () => {
    it('should delete all keys matching the regex pattern', () => {
      const cache = new Cache<string>();
      cache.set('user:1', 'Alice');
      cache.set('user:2', 'Bob');
      cache.set('post:1', 'Hello');

      cache.deletePattern(/^user:/);

      expect(cache.get('user:1')).toBeUndefined();
      expect(cache.get('user:2')).toBeUndefined();
      expect(cache.get('post:1')).toBe('Hello');
    });
  });

  describe('mget and mset', () => {
    it('should set and get multiple keys in bulk', () => {
      const cache = new Cache<number>();
      cache.mset({ k1: 10, k2: 20, k3: 30 });

      const bulkResult = cache.mget(['k1', 'k2', 'k3', 'k4']);
      expect(bulkResult).toEqual({
        k1: 10,
        k2: 20,
        k3: 30,
        k4: undefined,
      });
    });
  });

  describe('events', () => {
    it('should fire onCacheHit and onCacheMiss', () => {
      let hit = '';
      let miss = '';
      const cache = new Cache({
        onCacheHit: (k) => (hit = k),
        onCacheMiss: (k) => (miss = k),
      });
      cache.set('x', 100);
      cache.get('y');
      expect(miss).toBe('y');
      cache.get('x');
      expect(hit).toBe('x');
    });
  });

  describe('cleanupInterval', () => {
    it('should automatically remove expired items', async () => {
      const cache = new Cache({ ttl: 10 });
      cache.set('a', 1);
      cache.startCleanupInterval(15);

      await new Promise((r) => setTimeout(r, 20));

      expect(cache.size).toBe(0);
      cache.stopCleanupInterval();
    });
  });

  describe('withCache', () => {
    it('should cache async function results', async () => {
      let calls = 0;
      const fn = async (a: number) => {
        calls++;
        return a * 2;
      };

      const { withCache } = await import('./index');
      const cachedFn = withCache(fn, { ttl: 50 });

      const r1 = await cachedFn(5);
      const r2 = await cachedFn(5);

      expect(r1).toBe(10);
      expect(r2).toBe(10);
      expect(calls).toBe(1); // Second call used cache

      await new Promise((r) => setTimeout(r, 60)); // Wait for expiration

      const r3 = await cachedFn(5);
      expect(r3).toBe(10);
      expect(calls).toBe(2); // Cache expired, called again
    });
  });

  describe('TTLEngine', () => {
    it('should set items and revalidate non-expired keys', () => {
      const engine = new TTLEngine();
      engine.set('item1', 'value1', 5000);
      expect(engine.revalidate('item1')).toBe(true);
      expect(engine.revalidate('missing')).toBe(false);
    });
  });

  describe('SlidingWindowCache', () => {
    it('should extend TTL when key is accessed before expiry', async () => {
      const cache = new SlidingWindowCache<string, number>(100);
      cache.set('a', 42);
      expect(cache.size()).toBe(1);

      await new Promise((r) => setTimeout(r, 60));
      expect(cache.get('a')).toBe(42); // Access extends TTL by another 100ms

      await new Promise((r) => setTimeout(r, 60));
      expect(cache.get('a')).toBe(42); // Still valid due to sliding window extension
    });
  });

  describe('getOrSet', () => {
    it('should fetch value if exists or set it via callback', async () => {
      const cache = new Cache<string>();

      const v1 = await cache.getOrSet('test-key', async () => 'hello');
      expect(v1).toBe('hello');

      const v2 = await cache.getOrSet('test-key', async () => 'world');
      expect(v2).toBe('hello'); // uses cached value
    });
  });

  describe('getStats', () => {
    it('should calculate hit and miss statistics accurately', () => {
      const cache = new Cache<number>();
      cache.set('a', 1);
      cache.get('a'); // hit
      cache.get('b'); // miss

      expect(cache.getStats()).toEqual({ hits: 1, misses: 1, hitRatio: 0.5 });

      cache.clearStats();
      expect(cache.getStats()).toEqual({ hits: 0, misses: 0, hitRatio: 0 });
    });
  });

  describe('FileSystemStorageAdapter and LocalStorageAdapter', () => {
    it('should set and get items from file storage adapter', async () => {
      const { FileSystemStorageAdapter, LocalStorageAdapter, PersistentStorageAdapter } =
        await import('./index');
      const fsCache = new FileSystemStorageAdapter();
      await fsCache.setItem('k', 'v');
      const val = await fsCache.getItem('k');
      expect(val).toBe('v');

      const lsCache = new LocalStorageAdapter();
      expect(typeof lsCache.getItem).toBe('function');

      const pCache = new PersistentStorageAdapter();
      await pCache.set('pk', 100);
      expect(await pCache.get('pk')).toBe(100);
      await pCache.delete('pk');
      expect(await pCache.get('pk')).toBeUndefined();
    });
  });

  describe('BloomFilterCache', () => {
    it('should verify membership using BloomFilterCache', async () => {
      const { BloomFilterCache } = await import('./index');
      const bf = new BloomFilterCache();
      bf.add('item-1');
      expect(bf.mightContain('item-1')).toBe(true);
      expect(bf.mightContain('item-2')).toBe(false);
    });
  });

  describe('createStaleWhileRevalidateCache', () => {
    it('should return cached value while revalidating in background', async () => {
      const { createStaleWhileRevalidateCache } = await import('./index');
      const swr = createStaleWhileRevalidateCache(5000);
      let callCount = 0;
      const fetcher = async () => ++callCount;
      const first = await swr('key', fetcher);
      expect(first).toBe(1);
      const second = await swr('key', fetcher);
      expect(second).toBe(1); // still cached
      expect(callCount).toBe(1);
    });
  });

  describe('LruEvictionQueue', () => {
    it('should evict least recently used items when capacity is reached', async () => {
      const { LruEvictionQueue } = await import('./index');
      const lru = new LruEvictionQueue<string, number>(3);

      lru.set('a', 1);
      lru.set('b', 2);
      lru.set('c', 3);

      expect(lru.size()).toBe(3);
      expect(lru.has('a')).toBe(true);

      // Access 'a' to make it recently used
      lru.get('a');

      // Add 'd', should evict 'b' since 'a' was recently used and 'b' is the oldest
      lru.set('d', 4);

      expect(lru.size()).toBe(3);
      expect(lru.has('b')).toBe(false);
      expect(lru.has('a')).toBe(true);
      expect(lru.has('d')).toBe(true);
    });
  });
  describe('LruEvictionQueue prevents prototype pollution', () => {
    it('should work', async () => {
      const { LruEvictionQueue } = await import('./index');
      const queue = new LruEvictionQueue(10);
      queue.set('__proto__', 'polluted');
      expect(queue.has('__proto__')).toBe(false);
    });
  });
});
