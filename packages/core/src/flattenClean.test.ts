import { describe, it, expect } from 'vitest';
import { flattenClean, unflattenClean } from './flattenClean';

describe('flattenClean & unflattenClean', () => {
  it('should flatten nested objects and strip null/undefined', () => {
    const input = {
      user: {
        name: 'John',
        address: {
          city: 'New York',
          zip: null,
        },
      },
      tags: ['a', null, 'b'],
    };

    const flat = flattenClean(input);
    expect(flat['user.name']).toBe('John');
    expect(flat['user.address.city']).toBe('New York');
    expect(flat['user.address.zip']).toBeUndefined();
    expect(flat['tags.0']).toBe('a');
    expect(flat['tags.1']).toBe('b');
  });

  it('should unflatten single-level objects back to deep objects safely', () => {
    const flat = {
      'user.name': 'Alice',
      'user.address.city': 'London',
      'user.role': null,
    };

    const deep = unflattenClean(flat);
    expect(deep).toEqual({
      user: {
        name: 'Alice',
        address: {
          city: 'London',
        },
      },
    });
  });

  it('should prevent prototype pollution in unflattenClean', () => {
    const flat = {
      '__proto__.polluted': 'evil',
      'constructor.prototype.isAdmin': true,
      safe: 'ok',
    };

    const result = unflattenClean(flat);
    expect(result.safe).toBe('ok');
    expect(({} as any).polluted).toBeUndefined();
    expect(({} as any).isAdmin).toBeUndefined();
  });
});
