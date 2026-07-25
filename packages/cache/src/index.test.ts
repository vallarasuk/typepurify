import { describe, it, expect } from 'vitest';
import { Cache } from './index';

describe('@typepurify/cache', () => {
  it('should set and get values', () => {
    const cache = new Cache<string>();
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return undefined for missing keys', () => {
    const cache = new Cache();
    expect(cache.get('missing')).toBeUndefined();
  });

  it('should respect TTL and expire items', async () => {
    const cache = new Cache({ ttl: 50 });
    cache.set('key1', 'value1');

    expect(cache.get('key1')).toBe('value1');

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 60));

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
});
