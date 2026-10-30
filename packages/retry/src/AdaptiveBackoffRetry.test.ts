import { describe, it, expect } from 'vitest';
import { AdaptiveBackoffRetry } from './AdaptiveBackoffRetry';

describe('AdaptiveBackoffRetry', () => {
  it('should retry on failure and succeed', async () => {
    let callCount = 0;
    const retry = new AdaptiveBackoffRetry({ maxAttempts: 3, baseDelayMs: 5 });

    const result = await retry.run(async (attempt) => {
      callCount++;
      if (attempt < 2) {
        throw new Error('Temporary failure');
      }
      return 'recovered';
    });

    expect(result).toBe('recovered');
    expect(callCount).toBe(2);
  });

  it('should respect shouldRetry predicate', async () => {
    const retry = new AdaptiveBackoffRetry({
      maxAttempts: 3,
      shouldRetry: (err) => err.message !== 'FATAL',
    });

    await expect(
      retry.run(() => {
        throw new Error('FATAL');
      }),
    ).rejects.toThrow('FATAL');
  });
});
