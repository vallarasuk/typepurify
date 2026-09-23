import { describe, it, expect } from 'vitest';
import { MemoryBufferCache } from './MemoryBufferCache';
describe('MemoryBufferCache', () => {
  it('should store and retrieve values', () => {
    const cache = new MemoryBufferCache();
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
  });
});
