import { describe, it, expect } from 'vitest';
import { cleanDiff } from './cleanDiff';
import { clean } from './index';

describe('cleanDiff and prototype safety', () => {
  it('should compute stripped paths and diff counts correctly', () => {
    const data = {
      name: 'Alice',
      email: null,
      profile: {
        bio: undefined,
        age: 30,
        tags: [null, 'dev', undefined],
      },
      emptyObj: {},
    };

    const result = cleanDiff(data, { stripEmptyObjects: true });
    expect(result.cleaned).toEqual({
      name: 'Alice',
      profile: {
        age: 30,
        tags: ['dev'],
      },
    });
    expect(result.diff.strippedPaths).toContain('email');
    expect(result.diff.strippedPaths).toContain('profile.bio');
    expect(result.diff.strippedPaths).toContain('profile.tags[0]');
    expect(result.diff.strippedPaths).toContain('profile.tags[2]');
    expect(result.diff.strippedPaths).toContain('emptyObj');
    expect(result.diff.strippedCount).toBeGreaterThanOrEqual(4);
  });

  it('should protect against prototype pollution attack vectors', () => {
    const maliciousPayload = JSON.parse(
      '{"__proto__": {"polluted": true}, "constructor": {"prototype": {"admin": true}}, "valid": 123}',
    );

    const cleaned = clean(maliciousPayload) as any;
    expect(cleaned.valid).toBe(123);
    expect(({} as any).polluted).toBeUndefined();
    expect(({} as any).admin).toBeUndefined();
  });

  it('should safely preserve URL instances', () => {
    const url = new URL('https://example.com/api?query=1');
    const input = { endpoint: url, nullVal: null };
    const cleaned = clean(input);
    expect(cleaned.endpoint).toBeInstanceOf(URL);
    expect(cleaned.endpoint.href).toBe('https://example.com/api?query=1');
    expect((cleaned as any).nullVal).toBeUndefined();
  });
});
