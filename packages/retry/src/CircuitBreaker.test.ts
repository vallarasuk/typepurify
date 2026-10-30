import { describe, it, expect } from 'vitest';
import { CircuitBreaker } from './CircuitBreaker';

describe('CircuitBreaker', () => {
  it('should execute successfully when closed', async () => {
    const cb = new CircuitBreaker();
    const result = await cb.execute(() => 'success');
    expect(result).toBe('success');
    expect(cb.getState()).toBe('CLOSED');
  });

  it('should open after reaching failure threshold and reject immediately', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 50 });

    await expect(
      cb.execute(() => {
        throw new Error('fail 1');
      }),
    ).rejects.toThrow('fail 1');
    await expect(
      cb.execute(() => {
        throw new Error('fail 2');
      }),
    ).rejects.toThrow('fail 2');

    expect(cb.getState()).toBe('OPEN');
    await expect(cb.execute(() => 'blocked')).rejects.toThrow('CircuitBreaker is OPEN');

    // Wait for reset timeout to enter HALF_OPEN
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.getState()).toBe('HALF_OPEN');

    // Successful execution in HALF_OPEN resets breaker
    const ok = await cb.execute(() => 'recovered');
    expect(ok).toBe('recovered');
    expect(cb.getState()).toBe('CLOSED');
  });
});
