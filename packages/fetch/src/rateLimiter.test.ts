import { describe, it, expect } from 'vitest';
import { RateLimiter } from './rateLimiter';

describe('RateLimiter', () => {
  it('should allow requests within limit', async () => {
    const limiter = new RateLimiter({ maxRequests: 2, timeWindowMs: 1000, blockWait: false });
    await expect(limiter.acquire()).resolves.toBeUndefined();
    await expect(limiter.acquire()).resolves.toBeUndefined();
    await expect(limiter.acquire()).rejects.toThrow(); // 3rd should fail
  });
});
