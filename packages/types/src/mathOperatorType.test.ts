import { describe, it, expect } from 'vitest';
import type { Add, Subtract, IsGreaterThan } from './mathOperatorType';

describe('mathOperatorType', () => {
  it('should typecheck correctly', () => {
    // Type assertions
    const _t1: Add<2, 3> = 5;
    const _t2: Subtract<5, 2> = 3;
    const _t3: IsGreaterThan<5, 2> = true;

    // A trick to make sure vitest passes
    expect(_t1).toBe(5);
    expect(_t2).toBe(3);
    expect(_t3).toBe(true);
  });
});
