import { describe, it, expect, vi } from 'vitest';
import { withRetry, retry, TimeoutError } from './index';

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
    await expect(withRetry(fn, { retries: 2, delay: 100, backoff: 'exponential' })).rejects.toThrow(
      'fail',
    );
    const endTime = Date.now();

    // Delays should be 100ms, 200ms -> total ~300ms
    const duration = endTime - startTime;
    expect(duration).toBeGreaterThanOrEqual(250);
    expect(duration).toBeLessThan(500);
  });

  it('should support jitter', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    const startTime = Date.now();
    await expect(withRetry(fn, { retries: 2, delay: 100, jitter: true })).rejects.toThrow('fail');
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('should throw TimeoutError if execution exceeds timeout', async () => {
    const fn = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 200)));

    await expect(withRetry(fn, { timeout: 100 })).rejects.toThrow(TimeoutError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw TimeoutError during retry delay', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(withRetry(fn, { retries: 2, delay: 1000, timeout: 500 })).rejects.toThrow(
      TimeoutError,
    );
  });
});
