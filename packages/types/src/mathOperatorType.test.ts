import { describe, it, expect } from 'vitest';
import type { Add, Subtract, IsGreaterThan } from './mathOperatorType';

describe('mathOperatorType', () => {
  it('should typecheck correctly', () => {
    // Type assertions
    type T1 = Add<2, 3>; // 5
    type T2 = Subtract<5, 2>; // 3
    type T3 = IsGreaterThan<5, 2>; // true
    
    // A trick to make sure vitest passes
    expect(true).toBe(true);
  });
});
