import { describe, it, expect } from 'vitest';
import { JsonPatch } from './JsonPatch';

describe('JsonPatch', () => {
  it('should apply add, replace, and remove operations', () => {
    const doc = { name: 'Alice', details: { city: 'Paris' }, tags: ['alpha'] };

    const patched = JsonPatch.apply(doc, [
      { op: 'add', path: '/details/country', value: 'France' },
      { op: 'replace', path: '/name', value: 'Alice Cooper' },
      { op: 'add', path: '/tags/-', value: 'beta' },
      { op: 'remove', path: '/details/city' },
    ]);

    expect(patched.name).toBe('Alice Cooper');
    expect(patched.details.country).toBe('France');
    expect(patched.details.city).toBeUndefined();
    expect(patched.tags).toEqual(['alpha', 'beta']);
  });

  it('should test and verify values', () => {
    const doc = { status: 'active' };
    expect(() =>
      JsonPatch.apply(doc, [{ op: 'test', path: '/status', value: 'inactive' }]),
    ).toThrow('Test failed');

    expect(() =>
      JsonPatch.apply(doc, [{ op: 'test', path: '/status', value: 'active' }]),
    ).not.toThrow();
  });
});
