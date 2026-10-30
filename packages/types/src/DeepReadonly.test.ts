import { describe, it, expect } from 'vitest';
import { createDeepReadonly, type DeepReadonly } from './DeepReadonly';

describe('DeepReadonly', () => {
  it('should freeze objects and preserve primitive values', () => {
    const original = { a: 1, b: 'str', nested: { c: true } };
    const frozen = createDeepReadonly(original);

    expect(frozen.a).toBe(1);
    expect(frozen.nested.c).toBe(true);
    expect(Object.isFrozen(frozen)).toBe(true);
  });

  it('should handle primitives safely', () => {
    type Num = DeepReadonly<number>;
    const n: Num = 42;
    expect(n).toBe(42);

    const frozenNum = createDeepReadonly(42);
    expect(frozenNum).toBe(42);
  });
});
