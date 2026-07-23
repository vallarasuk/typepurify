import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withCache } from './index';

describe('@typepurify/cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should cache the result of the function', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const cachedFn = withCache(fn);

    const res1 = await cachedFn(1);
    const res2 = await cachedFn(1);

    expect(res1).toBe('success');
    expect(res2).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should call the function again after TTL expires', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const cachedFn = withCache(fn, { ttl: 1000 });

    await cachedFn(1); // Call 1

    vi.advanceTimersByTime(500);
    await cachedFn(1); // Call 2 (cached)
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(600); // 1100ms total, expired
    await cachedFn(1); // Call 3 (not cached)

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should distinguish between different arguments', async () => {
    const fn = vi.fn().mockImplementation(async (id: number) => `result-${id}`);
    const cachedFn = withCache(fn);

    await cachedFn(1);
    await cachedFn(2);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use a custom key generator', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const cachedFn = withCache(fn, {
      keyGenerator: (obj: { id: number }) => String(obj.id),
    });

    await cachedFn({ id: 1, ignore: true });
    await cachedFn({ id: 1, ignore: false });

    // Same key, should be cached
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
