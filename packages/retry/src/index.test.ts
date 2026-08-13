import { describe, it, expect, vi } from 'vitest';
import { withRetry, retry, TimeoutError, withExponentialBackoff } from './index';

describe('@typepurify/retry', () => {
  it('should export retry as an alias to withRetry', () => {
    expect(retry).toBe(withRetry);
  });

  it('should resolve immediately if function succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('success');

    const onRetry = vi.fn();

    const result = await withRetry(fn, { delay: 10, onRetry });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('should throw if it exhausts all retries', async () => {
    const error = new Error('fatal');
    const fn = vi.fn().mockRejectedValue(error);

    await expect(withRetry(fn, { retries: 2, delay: 10 })).rejects.toThrow('fatal');
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should not retry if shouldRetry returns false', async () => {
    const error = new Error('DoNotRetry');
    const fn = vi.fn().mockRejectedValue(error);

    const shouldRetry = (err: Error) => err.message !== 'DoNotRetry';

    await expect(withRetry(fn, { retries: 3, delay: 10, shouldRetry })).rejects.toThrow(
      'DoNotRetry',
    );
    expect(fn).toHaveBeenCalledTimes(1); // Fails immediately, no retries
  });

  it('should backoff exponentially', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    const startTime = Date.now();
    await expect(withRetry(fn, { retries: 2, delay: 10, backoff: 'exponential' })).rejects.toThrow(
      'fail',
    );
    const endTime = Date.now();

    // Delays should be 10ms, 20ms -> total ~30ms
    const duration = endTime - startTime;
    expect(duration).toBeGreaterThanOrEqual(25);
    expect(duration).toBeLessThan(150);
  });

  it('should support jitter', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    const startTime = Date.now();
    await expect(withRetry(fn, { retries: 2, delay: 10, jitter: true })).rejects.toThrow('fail');
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('should throw TimeoutError if execution exceeds timeout and abort the controller', async () => {
    let abortCalled = false;
    const globalAny = global as any;
    const originalAbortController = globalAny.AbortController;

    // Mock AbortController
    globalAny.AbortController = class MockAbortController {
      abort() {
        abortCalled = true;
      }
    };

    const fn = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 20)));

    await expect(withRetry(fn, { timeout: 10 })).rejects.toThrow(TimeoutError);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(abortCalled).toBe(true);

    globalAny.AbortController = originalAbortController;
  });

  it('should throw TimeoutError during retry delay', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(withRetry(fn, { retries: 2, delay: 100, timeout: 50 })).rejects.toThrow(
      TimeoutError,
    );
  });

  describe('onRetry', () => {
    it('should fire onRetry callback', async () => {
      let attempts = 0;
      const fn = async () => {
        throw new Error('fail');
      };
      await retry(fn, {
        retries: 2,
        delay: 5,
        onRetry: (err, a) => {
          attempts = a;
        },
      }).catch(() => {});
      expect(attempts).toBe(2);
    });
  });

  describe('CircuitBreaker', () => {
    it('should trip open after failure threshold and recover', async () => {
      const { CircuitBreaker } = await import('./index');
      const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 20 });

      const fn = vi.fn().mockRejectedValue(new Error('fail'));

      await expect(cb.execute(fn)).rejects.toThrow('fail');
      await expect(cb.execute(fn)).rejects.toThrow('fail');

      expect(cb.getState()).toBe('OPEN');

      await expect(cb.execute(fn)).rejects.toThrow('CircuitBreaker is OPEN');

      await new Promise((r) => setTimeout(r, 25));

      fn.mockResolvedValueOnce('success');

      await expect(cb.execute(fn)).resolves.toBe('success');
      expect(cb.getState()).toBe('CLOSED');
    });
  });

  describe('withExponentialBackoff', () => {
    it('should resolve if function succeeds on initial attempt', async () => {
      const fn = vi.fn().mockResolvedValue('ok');
      const result = await withExponentialBackoff(fn, 3, 10);
      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry with exponential delay on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('error 1'))
        .mockResolvedValueOnce('success');

      const result = await withExponentialBackoff(fn, 2, 10);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw RetryExhaustedError when all retries fail', async () => {
      const { RetryExhaustedError, withExponentialBackoff } = await import('./index');
      const fn = vi.fn().mockRejectedValue(new Error('error'));
      await expect(withExponentialBackoff(fn, 1, 1)).rejects.toThrow(RetryExhaustedError);
    });
  });

  describe('withLinearBackoff', () => {
    it('should retry with linear step delays and resolve on success', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockResolvedValueOnce('resolved');

      const { withLinearBackoff } = await import('./index');
      const res = await withLinearBackoff(fn, 3, 10);
      expect(res).toBe('resolved');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('withFibonacciBackoff', () => {
    it('should retry with fibonacci delays', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Fail'));
      const { withFibonacciBackoff, RetryExhaustedError } = await import('./index');
      const start = Date.now();
      await expect(withFibonacciBackoff(fn, 3, 20)).rejects.toThrow(RetryExhaustedError);
      // delays: 1*20 = 20, 1*20 = 20 (total ~40ms wait)
      expect(Date.now() - start).toBeGreaterThanOrEqual(30);
    });
  });

  describe('withRetryAsyncGenerator', () => {
    it('should retry a failing async generator', async () => {
      const { withRetryAsyncGenerator } = await import('./index');
      let attempts = 0;
      async function* gen() {
        attempts++;
        if (attempts === 1) throw new Error('fail');
        yield 1;
        yield 2;
      }

      const retryGen = withRetryAsyncGenerator(gen, 1, 10);
      const results = [];
      for await (const val of retryGen) {
        results.push(val);
      }
      expect(results).toEqual([1, 2]);
      expect(attempts).toBe(2);
    });
  });

  describe('RetryLock', () => {
    it('should acquire and release lock sequentially across async tasks', async () => {
      const { RetryLock } = await import('./index');
      const lock = new RetryLock();

      expect(lock.isLocked()).toBe(false);
      await lock.acquire();
      expect(lock.isLocked()).toBe(true);

      let step = 0;
      const worker = async () => {
        await lock.acquire();
        step = 1;
        lock.release();
      };

      const p = worker();
      expect(step).toBe(0); // Blocked on lock

      lock.release();
      await p;
      expect(step).toBe(1);
    });

    it('should execute task exclusively using runExclusive', async () => {
      const { RetryLock } = await import('./index');
      const lock = new RetryLock();
      const res = await lock.runExclusive(async () => {
        expect(lock.isLocked()).toBe(true);
        return 'exclusive';
      });
      expect(res).toBe('exclusive');
      expect(lock.isLocked()).toBe(false);
    });
  });

  describe('RetryEventEmitter', () => {
    it('should emit and unsubscribe retry events', async () => {
      const { RetryEventEmitter } = await import('./index');
      const emitter = new RetryEventEmitter();
      let fired = false;
      const unsubscribe = emitter.on('attempt', () => {
        fired = true;
      });

      emitter.emit('attempt');
      expect(fired).toBe(true);

      fired = false;
      unsubscribe();
      emitter.emit('attempt');
      expect(fired).toBe(false);
    });
  });

  describe('executeWithRetryBudget', () => {
    it('should respect retry budget limits', async () => {
      const { executeWithRetryBudget } = await import('./index');
      let calls = 0;
      const fn = async () => {
        calls++;
        if (calls === 1) throw new Error('First attempt failed');
        return 'success';
      };

      const res = await executeWithRetryBudget(fn, 0.5, 2);
      expect(res).toBe('success');
    });
  });

  describe('CircuitBreakerStateMachine', () => {
    it('should manage states, pause, and resume execution', async () => {
      const { CircuitBreakerStateMachine } = await import('./index');
      const cb = new CircuitBreakerStateMachine(2, 5000);
      expect(cb.getState()).toBe('CLOSED');
      expect(cb.canExecute()).toBe(true);

      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe('OPEN');
      expect(cb.canExecute()).toBe(false);

      cb.pause();
      expect(cb.getState()).toBe('PAUSED');

      cb.resume();
      expect(cb.getState()).toBe('CLOSED');
      expect(cb.canExecute()).toBe(true);
    });
  });

  describe('TokenBucketRateLimiter', () => {
    it('should consume tokens and reject when empty', async () => {
      const { TokenBucketRateLimiter } = await import('./index');
      const limiter = new TokenBucketRateLimiter(2, 1);
      expect(limiter.tryConsume(1)).toBe(true);
      expect(limiter.tryConsume(1)).toBe(true);
      expect(limiter.tryConsume(1)).toBe(false);
    });
  });

  describe('FailoverRouter', () => {
    it('should rotate endpoints on failover', async () => {
      const { FailoverRouter } = await import('./index');
      const router = new FailoverRouter(['https://a.com', 'https://b.com']);
      expect(router.getActiveEndpoint()).toBe('https://a.com');
      expect(router.failover()).toBe('https://b.com');
    });
  });

  describe('generateJitteredBackoff', () => {
    it('should generate delay within exponential bounds', async () => {
      const { generateJitteredBackoff } = await import('./index');
      const baseDelay = 100;
      const attempt = 2;
      const maxDelay = 30000;

      const delay = generateJitteredBackoff(baseDelay, attempt, maxDelay);

      // baseDelay * (2^attempt) = 100 * 4 = 400
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(400);
    });

    it('should respect maxDelay bound', async () => {
      const { generateJitteredBackoff } = await import('./index');
      const baseDelay = 1000;
      const attempt = 10;
      const maxDelay = 5000; // 1000 * 1024 > 5000

      const delay = generateJitteredBackoff(baseDelay, attempt, maxDelay);

      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(maxDelay);
    });
  });
  describe('generateJitteredBackoff maxAttempts', () => {
    it('should work', async () => {
      const { generateJitteredBackoff } = await import('./index');
      // Should succeed when attempt is within maxAttempts
      const delay = generateJitteredBackoff(100, 5, 5000, 10);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(5000);
      // Should throw when attempt exceeds maxAttempts
      expect(() => generateJitteredBackoff(100, 11, 5000, 10)).toThrow(
        'Maximum retry attempts (10) exceeded to prevent infinite loop',
      );
    });
  });
});
