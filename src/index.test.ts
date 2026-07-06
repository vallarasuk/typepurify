import { describe, it, expect } from 'vitest';
import { clean, cleanInPlace } from './index';

describe('typepurify core engine', () => {
  it('should deeply remove null and undefined values from messy data maps', () => {
    const apiPayload = {
      id: 101,
      profile: {
        title: null,
        geo: 'IN',
      },
      tags: ['React', null, 'TypeScript'],
    };

    const pristineResult = clean(apiPayload);

    expect(pristineResult).toEqual({
      id: 101,
      profile: {
        geo: 'IN',
      },
      tags: ['React', 'TypeScript'],
    });
  });

  it('should use single-pass array logic correctly', () => {
    const arr = [1, null, 2, undefined, 3];
    expect(clean(arr)).toEqual([1, 2, 3]);
  });

  it('should trim strings if trimStrings is true', () => {
    const payload = {
      name: '  Vallarasu  ',
      empty: '   ',
    };

    expect(clean(payload, { trimStrings: true, stripEmptyStrings: true })).toEqual({
      name: 'Vallarasu',
    });
  });

  it('should strip custom values via stripWhen', () => {
    const payload = {
      id: -1,
      status: 'N/A',
      valid: true,
      nested: {
        val: 'N/A',
      },
    };

    const result = clean(payload, {
      stripWhen: (val) => val === 'N/A' || val === -1,
    });

    expect(result).toEqual({ valid: true, nested: {} });
  });

  it('should clean in place (mutate original object)', () => {
    const original = {
      a: 1,
      b: null,
      c: [null, 2, undefined],
      d: { e: undefined, f: 'N/A' },
    };

    const result = cleanInPlace(original, { stripWhen: (v) => v === 'N/A' });

    expect(original).toEqual({
      a: 1,
      c: [2],
      d: {},
    });
    // Verify it returned the exact same reference
    expect(result === original).toBe(true);
  });
});
