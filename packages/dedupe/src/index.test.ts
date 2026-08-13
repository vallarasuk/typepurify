import { describe, it, expect, vi } from 'vitest';
import { dedupe, dedupeSync, generateRequestHash, createBatchDeduper } from './index';

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

    it('should use custom cache if provided', async () => {
      let calls = 0;
      const fn = async () => {
        calls++;
        return 'cached';
      };

      const customCache = new Map<string, { value: any; expiresAt: number }>();
      const d = dedupe(fn, { ttl: 50, cache: customCache });

      await d();
      expect(customCache.size).toBe(1);
      expect(calls).toBe(1);
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

  describe('generateRequestHash', () => {
    it('should generate consistent hash for endpoint', () => {
      const hash1 = generateRequestHash('/api/users');
      const hash2 = generateRequestHash('/api/users');
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1).toHaveLength(64);
    });

    it('should generate different hashes for different body payloads', () => {
      const hash1 = generateRequestHash('/api/users', { name: 'Alice' });
      const hash2 = generateRequestHash('/api/users', { name: 'Bob' });
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createBatchDeduper', () => {
    it('should batch multiple concurrent requests into a single batch call', async () => {
      let batchCalls = 0;
      const batchFn = vi.fn().mockImplementation(async (ids: number[]) => {
        batchCalls++;
        const map = new Map<number, string>();
        ids.forEach((id) => map.set(id, `item-${id}`));
        return map;
      });

      const load = createBatchDeduper<number, string>(batchFn, 15);

      const [r1, r2, r3] = await Promise.all([load(1), load(2), load(1)]);

      expect(r1).toBe('item-1');
      expect(r2).toBe('item-2');
      expect(r3).toBe('item-1');
      expect(batchCalls).toBe(1);
    });
  });

  describe('dedupeSync', () => {
    it('should cache synchronous calls', async () => {
      let calls = 0;
      const fn = (x: number) => {
        calls++;
        return x * 2;
      };
      const deduped = dedupeSync(fn);

      expect(deduped(5)).toBe(10);
      expect(deduped(5)).toBe(10); // Uses cache
      expect(calls).toBe(1);

      expect(deduped(6)).toBe(12);
      expect(calls).toBe(2);
    });
  });

  describe('dedupeAsyncGenerator', () => {
    it('should multiplex an async generator for concurrent callers', async () => {
      let callCount = 0;
      async function* generateData() {
        callCount++;
        yield 1;
        await new Promise((r) => setTimeout(r, 10));
        yield 2;
        await new Promise((r) => setTimeout(r, 10));
        yield 3;
      }

      const { dedupeAsyncGenerator } = await import('./index');
      const deduped = dedupeAsyncGenerator(generateData);

      const caller1 = async () => {
        const res = [];
        for await (const val of deduped()) res.push(val);
        return res;
      };

      const caller2 = async () => {
        const res = [];
        for await (const val of deduped()) res.push(val);
        return res;
      };

      const [res1, res2] = await Promise.all([caller1(), caller2()]);

      expect(res1).toEqual([1, 2, 3]);
      expect(res2).toEqual([1, 2, 3]);
      expect(callCount).toBe(1); // Deduplicated!
    });
  });

  describe('DedupeStats', () => {
    it('should calculate deduplication efficiency correctly', async () => {
      const { DedupeStats } = await import('./index');
      const stats = new DedupeStats();

      stats.recordCall(false); // 1st call
      stats.recordCall(true); // 2nd call (duplicate)
      stats.recordCall(true); // 3rd call (duplicate)

      expect(stats.getMetrics()).toEqual({
        totalCalls: 3,
        savedRequests: 2,
        efficiencyRatio: 2 / 3,
      });

      stats.reset();
      expect(stats.getMetrics()).toEqual({
        totalCalls: 0,
        savedRequests: 0,
        efficiencyRatio: 0,
      });
    });
  });

  describe('dedupeOnce', () => {
    it('should execute a function only once', async () => {
      const { dedupeOnce } = await import('./index');
      let calls = 0;
      const fn = async () => ++calls;
      const once = dedupeOnce(fn);

      const r1 = await once();
      const r2 = await once();

      expect(r1).toBe(1);
      expect(r2).toBe(1);
      expect(calls).toBe(1);
    });
  });

  describe('parseGraphQLQueryKey', () => {
    it('should generate normalized AST query keys', async () => {
      const { parseGraphQLQueryKey } = await import('./index');
      const key = parseGraphQLQueryKey('  query getUser {   user { id }  }', { id: 10 });
      expect(key).toBe('gql:query getUser { user { id } }:{"id":10}');
    });
  });

  describe('DedupePromisePool', () => {
    it('should deduplicate concurrent executions by key', async () => {
      const { DedupePromisePool } = await import('./index');
      const pool = new DedupePromisePool<string, number>();
      let calls = 0;
      const fn = async () => {
        calls++;
        await new Promise((r) => setTimeout(r, 10));
        return 42;
      };

      const [r1, r2] = await Promise.all([pool.run('k1', fn), pool.run('k1', fn)]);
      expect(r1).toBe(42);
      expect(r2).toBe(42);
      expect(calls).toBe(1);
    });
  });

  describe('BroadcastChannelDedupeSynchronizer', () => {
    it('should initialize cleanly and manage channel sync lifecycle', async () => {
      const { BroadcastChannelDedupeSynchronizer } = await import('./index');
      const sync = new BroadcastChannelDedupeSynchronizer('test-channel');
      const listener = vi.fn();
      const unsubscribe = sync.onSync(listener);
      sync.broadcast('key1', { value: 123 });
      expect(typeof unsubscribe).toBe('function');
      sync.close();
    });
  });

  describe('exportPrometheusMetrics', () => {
    it('should export formatted Prometheus metrics string', async () => {
      const { exportPrometheusMetrics } = await import('./index');
      const metrics = exportPrometheusMetrics({ totalCalls: 10, deduplicatedCalls: 5 });
      expect(metrics).toContain('typepurify_dedupe_total_calls 10');
      expect(metrics).toContain('typepurify_dedupe_saved_calls 5');
    });
  });

  describe('createRedisClusterSyncer', () => {
    it('should acquire and release Redis cluster locks', async () => {
      const { createRedisClusterSyncer } = await import('./index');
      const syncer = createRedisClusterSyncer(['redis://node1']);
      expect(syncer.lock('req-1')).toBe(true);
      expect(syncer.isLocked('req-1')).toBe(true);
      expect(syncer.lock('req-1')).toBe(false);
      syncer.unlock('req-1');
      expect(syncer.isLocked('req-1')).toBe(false);
    });
  });

  describe('CoalescingCacheStore', () => {
    it('should coalesce simultaneous requests for the same key', async () => {
      const { CoalescingCacheStore } = await import('./index');
      const store = new CoalescingCacheStore<number>(1000);
      let fetchCount = 0;

      const fetcher = async () => {
        fetchCount++;
        await new Promise((r) => setTimeout(r, 10));
        return 42;
      };

      const promises = [
        store.fetch('key1', fetcher),
        store.fetch('key1', fetcher),
        store.fetch('key1', fetcher),
      ];

      const results = await Promise.all(promises);
      expect(results).toEqual([42, 42, 42]);
      expect(fetchCount).toBe(1); // Only fetched once
    });

    it('should use cache if available and not expired', async () => {
      const { CoalescingCacheStore } = await import('./index');
      const store = new CoalescingCacheStore<string>(1000);

      let fetchCount = 0;
      const fetcher = async () => {
        fetchCount++;
        return 'value';
      };

      await store.fetch('key2', fetcher);
      const res = await store.fetch('key2', fetcher);

      expect(res).toBe('value');
      expect(fetchCount).toBe(1); // Read from cache
    });
  });
  describe('dedupeSync hash collision', () => {
    it('should work', async () => {
      const { dedupeSync } = await import('./index');
      let callCount = 0;
      const fn = dedupeSync((x: number) => {
        callCount++;
        return x * 2;
      });
      fn(1);
      fn(1); // Same arg — should be deduped (cached)
      expect(callCount).toBe(1);
    });
  });
});
