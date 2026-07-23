import { describe, it, expect } from 'vitest';
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

    // Call simultaneously
    const results = await Promise.all([dedupedFn(1), dedupedFn(1), dedupedFn(1)]);

    expect(results).toEqual(['result-1', 'result-1', 'result-1']);
    expect(callCount).toBe(1); // Should only be executed once
  });

  it('should call the function again after the previous promise has resolved', async () => {
    let callCount = 0;
    const asyncFn = async (id: number) => {
      callCount++;
      return `result-${id}`;
    };

    const dedupedFn = dedupe(asyncFn);

    await dedupedFn(1);
    await dedupedFn(1); // Called after the first one finishes

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

    // Call with different arguments
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

    // Ignore `rand` in the key generator
    const dedupedFn = dedupe(asyncFn, {
      keyGenerator: (obj) => String(obj.id),
    });

    await Promise.all([
      dedupedFn({ id: 1, rand: Math.random() }),
      dedupedFn({ id: 1, rand: Math.random() }),
    ]);

    expect(callCount).toBe(1);
  });
});
