import { describe, it, expect } from 'vitest';
import { createDeepReadonly } from './DeepReadonly';
describe('DeepReadonly', () => {
  it('should work', () => {
    expect(createDeepReadonly({ a: 1 })).toEqual({ a: 1 });
  });
});
