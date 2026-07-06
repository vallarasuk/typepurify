import { describe, it, expect } from 'vitest';
import { clean } from './index';

describe('typeclean core integration test suite', () => {
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
});
