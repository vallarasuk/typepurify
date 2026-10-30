import { describe, it, expect } from 'vitest';
import { TaggedCache } from './TaggedCache';

describe('TaggedCache', () => {
  it('should cache items and invalidate by tag', () => {
    const cache = new TaggedCache();
    cache.set('user:1', { name: 'Alice' }, ['users', 'team:engineering']);
    cache.set('user:2', { name: 'Bob' }, ['users', 'team:sales']);
    cache.set('config:app', { env: 'prod' }, ['system']);

    expect(cache.get('user:1')).toEqual({ name: 'Alice' });
    expect(cache.get('user:2')).toEqual({ name: 'Bob' });
    expect(cache.get('config:app')).toEqual({ env: 'prod' });

    // Invalidate engineering team
    const count = cache.invalidateTag('team:engineering');
    expect(count).toBe(1);
    expect(cache.get('user:1')).toBeUndefined();
    expect(cache.get('user:2')).toBeDefined();

    // Invalidate all users
    cache.invalidateTag('users');
    expect(cache.get('user:2')).toBeUndefined();
    expect(cache.get('config:app')).toBeDefined();
  });

  it('should invalidate multiple tags simultaneously', () => {
    const cache = new TaggedCache();
    cache.set('doc:1', 'Doc 1', ['tagA']);
    cache.set('doc:2', 'Doc 2', ['tagB']);
    cache.set('doc:3', 'Doc 3', ['tagC']);

    cache.invalidateTags(['tagA', 'tagB']);
    expect(cache.has('doc:1')).toBe(false);
    expect(cache.has('doc:2')).toBe(false);
    expect(cache.has('doc:3')).toBe(true);
  });
});
