import { describe, it, expect } from 'vitest';
import { CircuitBreaker } from './CircuitBreaker';
describe('CircuitBreaker', () => {
  it('should execute', () => {
    const cb = new CircuitBreaker();
    expect(cb.execute(() => 'ok')).toBe('ok');
  });
});
