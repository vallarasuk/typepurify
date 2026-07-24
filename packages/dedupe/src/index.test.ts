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
});
