import { describe, it, expect, vi } from 'vitest';
import { dedupe } from './index';

describe('@typepurify/dedupe', () => {
  it('should only call the underlying function once for identical simultaneous calls', async () => {
    let callCount = 0;
    const asyncFn = async (id: number) => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return `result-${id}`;
    };

    const dedupedFn = dedupe(asyncFn);

    const results = await Promise.all([dedupedFn(1), dedupedFn(1), dedupedFn(1)]);

    expect(results).toEqual(['result-1', 'result-1', 'result-1']);
    expect(callCount).toBe(1);
  });

  it('should call the function again after the previous promise has resolved', async () => {
    let callCount = 0;
    const asyncFn = async (id: number) => {
      callCount++;
      return `result-${id}`;
    };

    const dedupedFn = dedupe(asyncFn);

    await dedupedFn(1);
    await dedupedFn(1);

    expect(callCount).toBe(2);
  });

  it('should distinguish between different arguments', async () => {
    let callCount = 0;
    const asyncFn = async (id: number) => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return `result-${id}`;
    };

    const dedupedFn = dedupe(asyncFn);

    const results = await Promise.all([dedupedFn(1), dedupedFn(2)]);

    expect(results).toEqual(['result-1', 'result-2']);
    expect(callCount).toBe(2);
  });

  it('should use custom keyGenerator if provided', async () => {
    let callCount = 0;
    const asyncFn = async (obj: { id: number; rand: number }) => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return obj.id;
    };

    const dedupedFn = dedupe(asyncFn, {
      keyGenerator: (obj) => String(obj.id),
    });

    await Promise.all([
      dedupedFn({ id: 1, rand: Math.random() }),
      dedupedFn({ id: 1, rand: Math.random() }),
    ]);

    expect(callCount).toBe(1);
  });

  it('should debounce identical calls within the window', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const deduped = dedupe(fn, { debounce: 20 });

    // Call 3 times quickly
    const p1 = deduped(1);
    const p2 = deduped(1);
    const p3 = deduped(1);

    // fn shouldn't be called yet
    expect(fn).not.toHaveBeenCalled();

    const results = await Promise.all([p1, p2, p3]);

    expect(results).toEqual(['ok', 'ok', 'ok']);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset the debounce timer if called before expiry', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const deduped = dedupe(fn, { debounce: 30 });

    const p1 = deduped(1);

    await new Promise((r) => setTimeout(r, 20)); // wait 20ms
    const p2 = deduped(1); // this resets the 30ms timer

    // Total wait > 30ms, but fn shouldn't fire yet because p2 reset the timer
    expect(fn).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 40));

    expect(fn).toHaveBeenCalledTimes(1);

    const results = await Promise.all([p1, p2]);
    expect(results).toEqual(['ok', 'ok']);
  });

  describe('clearDedupeCache', () => {
    it('should allow clearing the cache manually', async () => {
      let count = 0;
      const fn = async (x: string) => {
        count++;
        await new Promise((r) => setTimeout(r, 10));
        return x;
      };
      const d = dedupe(fn);
      const p1 = d('a');
      d.clearDedupeCache('a');
      const p2 = d('a');
      await Promise.all([p1, p2]);
      expect(count).toBe(2);
    });

    it('should clear all cache if no key provided', async () => {
      let count = 0;
      const fn = async (x: string) => {
        count++;
        await new Promise((r) => setTimeout(r, 10));
        return x;
      };
      const d = dedupe(fn);
      const p1 = d('a');
      const p2 = d('b');
      d.clearDedupeCache();
      const p3 = d('a');
      await Promise.all([p1, p2, p3]);
      expect(count).toBe(3);
    });
  });

  describe('ttl caching', () => {
    it('should return cached result if within ttl', async () => {
      let calls = 0;
      const fn = async () => {
        calls++;
        return 'cached';
      };

      const d = dedupe(fn, { ttl: 50 });

      await d(); // 1st call
      await d(); // Uses cache

      expect(calls).toBe(1);

      await new Promise((r) => setTimeout(r, 60)); // Wait for expiration

      await d(); // 2nd call
      expect(calls).toBe(2);
    });
  });

  describe('maxConcurrent', () => {
    it('should limit concurrent executions', async () => {
      let concurrent = 0;
      let maxObserved = 0;

      const fn = async (id: number) => {
        concurrent++;
        maxObserved = Math.max(maxObserved, concurrent);
        await new Promise((r) => setTimeout(r, 20));
        concurrent--;
        return id;
      };

      const d = dedupe(fn, { maxConcurrent: 2 });

      // Fire 5 simultaneous requests with different keys so they don't get deduped
      await Promise.all([d(1), d(2), d(3), d(4), d(5)]);

      expect(maxObserved).toBe(2); // Never exceeded 2 concurrent executions
    });
  });
});
