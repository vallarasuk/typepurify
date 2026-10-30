import { describe, it, expect } from 'vitest';
import { MemoryBufferCache } from './MemoryBufferCache';

describe('MemoryBufferCache', () => {
  it('should store and retrieve items', () => {
    const cache = new MemoryBufferCache();
    cache.set('a', 123);
    expect(cache.get('a')).toBe(123);
    expect(cache.has('a')).toBe(true);
    expect(cache.size).toBe(1);
  });

  it('should evict least recently used item when maxSize is reached', () => {
    const cache = new MemoryBufferCache({ maxSize: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    // access 'a' to make 'b' LRU
    cache.get('a');
    cache.set('c', 3);

    expect(cache.has('b')).toBe(false);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });

  it('should expire items after TTL', async () => {
    const cache = new MemoryBufferCache({ ttl: 50 });
    cache.set('temp', 'value');
    expect(cache.get('temp')).toBe('value');

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(cache.get('temp')).toBeUndefined();
    expect(cache.has('temp')).toBe(false);
  });
});
