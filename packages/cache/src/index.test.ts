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
});
