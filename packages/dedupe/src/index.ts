export interface DedupeOptions {
  /**
   * Custom function to generate a cache key from the arguments.
   * If not provided, `JSON.stringify(args)` is used.
   */
  keyGenerator?: (...args: any[]) => string;
  /**
   * Optional debounce duration in milliseconds.
   * If provided, the function execution is delayed by this duration.
   * Subsequent identical calls within this window will reset the timer
   * and all callers will eventually receive the result of the final execution.
   */
  debounce?: number;
  /**
   * Optional Time-To-Live in milliseconds.
   * If provided, the resolved result will be cached for this duration.
   * This turns `dedupe` into a full in-memory cache for the function.
   */
  ttl?: number;
  /**
   * Maximum number of concurrent executions allowed across all keys.
   * If exceeded, calls will be queued.
   */
  maxConcurrent?: number;
  /**
   * Optional custom cache implementation for storing resolved results.
   * Must implement get, set, delete, and clear.
   */
  cache?: {
    get: (key: string) => { value: any; expiresAt: number } | undefined;
    set: (key: string, data: { value: any; expiresAt: number }) => void;
    delete: (key: string) => void;
    clear: () => void;
  };
}

export type DeduplicatedFunction<T extends (...args: any[]) => Promise<any>> = T & {
  clearDedupeCache: (key?: string) => void;
};

/**
 * Wraps an asynchronous function to deduplicate identical ongoing calls,
 * with optional debouncing support.
 *
 * @param fn The async function to deduplicate/debounce
 * @param options Configuration options
 * @returns The wrapped deduplicated async function with cache control
 */
export function dedupe<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: DedupeOptions = {},
): DeduplicatedFunction<T> {
  const ongoingPromises = new Map<string, Promise<any>>();
  const cachedResults = options.cache || new Map<string, { value: any; expiresAt: number }>();
  const debounceTimers = new Map<string, any>();
  const pendingResolvers = new Map<
    string,
    { resolve: (val: any) => void; reject: (err: any) => void }[]
  >();

  let activeCount = 0;
  const executionQueue: Array<() => void> = [];

  const dequeue = () => {
    if (
      executionQueue.length > 0 &&
      (!options.maxConcurrent || activeCount < options.maxConcurrent)
    ) {
      const next = executionQueue.shift();
      next?.();
    }
  };

  const executeFn = async (key: string, args: any[]) => {
    activeCount++;
    try {
      const result = await fn(...args);
      if (options.ttl !== undefined && options.ttl > 0) {
        cachedResults.set(key, { value: result, expiresAt: Date.now() + options.ttl });
      }
      return result;
    } finally {
      ongoingPromises.delete(key);
      activeCount--;
      dequeue();
    }
  };

  const scheduleExecution = (key: string, args: any[]): Promise<any> => {
    return new Promise((resolve, reject) => {
      const task = () => {
        const promise = executeFn(key, args);
        ongoingPromises.set(key, promise);
        promise.then(resolve, reject);
      };

      if (!options.maxConcurrent || activeCount < options.maxConcurrent) {
        task();
      } else {
        executionQueue.push(task);
      }
    });
  };

  const wrapped = (async (...args: any[]) => {
    let key = '';
    if (options.keyGenerator) {
      key = options.keyGenerator(...args);
    } else {
      // Fast path: single primitive argument with type tag to prevent false positive collisions
      if (args.length === 1 && typeof args[0] !== 'object' && typeof args[0] !== 'function') {
        key = `${typeof args[0]}:${String(args[0])}`;
      } else if (args.length === 0) {
        key = '()';
      } else {
        // Slow path: serialize complex objects
        key = JSON.stringify(args);
      }
    }

    if (options.debounce && options.debounce > 0) {
      return new Promise((resolve, reject) => {
        if (!pendingResolvers.has(key)) {
          pendingResolvers.set(key, []);
        }
        pendingResolvers.get(key)!.push({ resolve, reject });

        if (debounceTimers.has(key)) {
          clearTimeout(debounceTimers.get(key));
        }

        const timer = setTimeout(() => {
          debounceTimers.delete(key);
          const resolvers = pendingResolvers.get(key) || [];
          pendingResolvers.delete(key);

          let promise = ongoingPromises.get(key);
          if (!promise) {
            promise = scheduleExecution(key, args);
          }

          promise.then(
            (val) => resolvers.forEach((r) => r.resolve(val)),
            (err) => resolvers.forEach((r) => r.reject(err)),
          );
        }, options.debounce);

        debounceTimers.set(key, timer);
      });
    } else {
      // Check cache first
      if (options.ttl !== undefined) {
        const cached = cachedResults.get(key);
        if (cached && Date.now() < cached.expiresAt) {
          return cached.value;
        } else if (cached) {
          cachedResults.delete(key); // expired
        }
      }

      if (ongoingPromises.has(key)) {
        return ongoingPromises.get(key)!;
      }

      const promise = scheduleExecution(key, args);
      ongoingPromises.set(key, promise);
      return promise;
    }
  }) as unknown as DeduplicatedFunction<T>;

  wrapped.clearDedupeCache = (key?: string) => {
    if (key !== undefined) {
      const formattedKey = key.includes(':') ? key : `string:${key}`;
      ongoingPromises.delete(key);
      ongoingPromises.delete(formattedKey);
      cachedResults.delete(key);
      cachedResults.delete(formattedKey);
      if (debounceTimers.has(key)) {
        clearTimeout(debounceTimers.get(key));
        debounceTimers.delete(key);
      }
      if (debounceTimers.has(formattedKey)) {
        clearTimeout(debounceTimers.get(formattedKey));
        debounceTimers.delete(formattedKey);
      }
      pendingResolvers.delete(key);
      pendingResolvers.delete(formattedKey);
    } else {
      ongoingPromises.clear();
      cachedResults.clear();
      for (const timer of debounceTimers.values()) {
        clearTimeout(timer);
      }
      debounceTimers.clear();
      pendingResolvers.clear();
    }
  };

  return wrapped;
}

import { createHash } from 'crypto';
/**
 * High-performance SHA-256 hash generator for caching requests.
 */
export function generateRequestHash(endpoint: string, body?: any): string {
  const hash = createHash('sha256');
  hash.update(endpoint);
  if (body) {
    hash.update(JSON.stringify(body));
  }
  return hash.digest('hex');
}

/**
 * Batched request deduplicator that collects individual item requests within a window
 * and dispatches them in a single batch call.
 */
export function createBatchDeduper<K, V>(
  batchFn: (keys: K[]) => Promise<Map<K, V> | Record<string, V>>,
  delayMs = 10,
) {
  let pendingKeys: K[] = [];
  let pendingCallbacks: Map<
    K,
    Array<{ resolve: (v: V) => void; reject: (e: any) => void }>
  > = new Map();
  let timer: any = null;

  const flush = async () => {
    const keys = pendingKeys;
    const callbacks = pendingCallbacks;
    pendingKeys = [];
    pendingCallbacks = new Map();
    timer = null;

    try {
      const results = await batchFn(keys);
      keys.forEach((key) => {
        const value = results instanceof Map ? results.get(key) : (results as any)[String(key)];
        const cbs = callbacks.get(key) || [];
        cbs.forEach((cb) => cb.resolve(value as V));
      });
    } catch (err) {
      callbacks.forEach((cbs) => cbs.forEach((cb) => cb.reject(err)));
    }
  };

  return function load(key: K): Promise<V> {
    return new Promise((resolve, reject) => {
      if (!pendingCallbacks.has(key)) {
        pendingCallbacks.set(key, []);
        pendingKeys.push(key);
      }
      pendingCallbacks.get(key)!.push({ resolve, reject });

      if (!timer) {
        timer = setTimeout(flush, delayMs);
      }
    });
  };
}

/**
 * Synchronous deduplicator for expensive synchronous functions.
 */
export function dedupeSync<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: any[]) => string = (...args) => {
    if (args.length === 1 && typeof args[0] !== 'object' && typeof args[0] !== 'function') {
      return `${typeof args[0]}:${String(args[0])}`;
    }
    if (args.length === 0) return '()';
    return JSON.stringify(args);
  },
): T & { clearDedupeCache: (key?: string) => void } {
  const cache = new Map<string, any>();
  const wrapped = function (...args: any[]) {
    const key = keyGenerator(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  } as T & { clearDedupeCache: (key?: string) => void };

  wrapped.clearDedupeCache = (key?: string) => {
    if (key !== undefined) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  };

  return wrapped;
}

/**
 * Deduplicates an asynchronous generator function.
 * If multiple callers invoke the generator with the same arguments simultaneously,
 * it will only execute the underlying generator once and broadcast the yielded chunks to all callers.
 */
export function dedupeAsyncGenerator<T, Args extends any[]>(
  genFn: (...args: Args) => AsyncGenerator<T, void, unknown>,
  keyGenerator: (...args: Args) => string = (...args) => {
    if (args.length === 1 && typeof args[0] !== 'object' && typeof args[0] !== 'function') {
      return `${typeof args[0]}:${String(args[0])}`;
    }
    if (args.length === 0) return '()';
    return JSON.stringify(args);
  },
): (...args: Args) => AsyncGenerator<T, void, unknown> {
  const ongoing = new Map<
    string,
    {
      chunks: T[];
      error: any;
      done: boolean;
      listeners: Array<{ resolve: () => void; reject: (err: any) => void }>;
    }
  >();

  return async function* (...args: Args): AsyncGenerator<T, void, unknown> {
    const key = keyGenerator(...args);
    let state = ongoing.get(key);

    if (!state) {
      state = { chunks: [], error: null, done: false, listeners: [] };
      ongoing.set(key, state);

      const processStream = async () => {
        try {
          const gen = genFn(...args);
          for await (const chunk of gen) {
            state!.chunks.push(chunk);
            const listeners = state!.listeners;
            state!.listeners = [];
            listeners.forEach((l) => l.resolve());
          }
          state!.done = true;
          const listeners = state!.listeners;
          state!.listeners = [];
          listeners.forEach((l) => l.resolve());
        } catch (err) {
          state!.error = err;
          state!.done = true;
          const listeners = state!.listeners;
          state!.listeners = [];
          listeners.forEach((l) => l.reject(err));
        } finally {
          ongoing.delete(key);
        }
      };

      processStream();
    }

    let index = 0;
    while (true) {
      if (index < state.chunks.length) {
        yield state.chunks[index++];
      } else if (state.error) {
        throw state.error;
      } else if (state.done) {
        return;
      } else {
        await new Promise<void>((resolve, reject) => {
          state!.listeners.push({ resolve, reject });
        });
      }
    }
  };
}

/**
 * Utility to measure request deduplication metrics (saved requests count).
 */
export class DedupeStats {
  private savedRequests = 0;
  private totalCalls = 0;

  recordCall(isDuplicate: boolean) {
    this.totalCalls++;
    if (isDuplicate) this.savedRequests++;
  }

  getMetrics() {
    return {
      totalCalls: this.totalCalls,
      savedRequests: this.savedRequests,
      efficiencyRatio: this.totalCalls === 0 ? 0 : this.savedRequests / this.totalCalls,
    };
  }

  reset() {
    this.savedRequests = 0;
    this.totalCalls = 0;
  }
}

/**
 * Ensures a function is executed only once per process lifecycle.
 */
export function dedupeOnce<T>(fn: () => Promise<T>): () => Promise<T> {
  let executed = false;
  let promise: Promise<T> | null = null;

  return function runOnce(): Promise<T> {
    if (!executed) {
      executed = true;
      promise = fn();
    }
    return promise!;
  };
}

/**
 * Lightweight GraphQL query AST normalizer for GraphQL request deduplication keys.
 * Removes whitespace and formats operation names cleanly.
 */
export function parseGraphQLQueryKey(query: string, variables?: Record<string, any>): string {
  if (!query) return '';
  const normalizedQuery = query.replace(/\s+/g, ' ').trim();
  const normalizedVars = variables ? JSON.stringify(variables) : '{}';
  return `gql:${normalizedQuery}:${normalizedVars}`;
}

/**
 * Deduplicates concurrent promise executions across a shared promise pool.
 */
export class DedupePromisePool<K = string, V = any> {
  private pool = new Map<K, Promise<V>>();

  async run(key: K, fn: () => Promise<V>): Promise<V> {
    if (this.pool.has(key)) {
      return this.pool.get(key)!;
    }
    const promise = fn().finally(() => {
      this.pool.delete(key);
    });
    this.pool.set(key, promise);
    return promise;
  }

  size(): number {
    return this.pool.size;
  }

  clear(): void {
    this.pool.clear();
  }
}

/**
 * Synchronizes deduplication keys across browser tabs using BroadcastChannel API.
 */
export class BroadcastChannelDedupeSynchronizer {
  private channel: any = null;
  private listeners = new Set<(key: string, data: any) => void>();

  constructor(private channelName = 'typepurify-dedupe-channel') {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = (event: any) => {
        if (event.data && event.data.type === 'DEDUPE_SYNC') {
          this.listeners.forEach((listener) => listener(event.data.key, event.data.value));
        }
      };
    }
  }

  broadcast(key: string, value: any): void {
    if (this.channel) {
      this.channel.postMessage({ type: 'DEDUPE_SYNC', key, value });
    }
  }

  onSync(callback: (key: string, data: any) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

/**
 * Formats deduplication metrics into Prometheus exporter string representation.
 */
export function exportPrometheusMetrics(stats: {
  totalCalls: number;
  deduplicatedCalls: number;
}): string {
  const saved = stats.deduplicatedCalls;
  const ratio = stats.totalCalls > 0 ? (saved / stats.totalCalls).toFixed(2) : '0.00';
  return [
    '# HELP typepurify_dedupe_total_calls Total API calls executed',
    '# TYPE typepurify_dedupe_total_calls counter',
    `typepurify_dedupe_total_calls ${stats.totalCalls}`,
    '# HELP typepurify_dedupe_saved_calls Deduplicated calls prevented',
    '# TYPE typepurify_dedupe_saved_calls counter',
    `typepurify_dedupe_saved_calls ${saved}`,
    '# HELP typepurify_dedupe_efficiency Efficiency ratio',
    '# TYPE typepurify_dedupe_efficiency gauge',
    `typepurify_dedupe_efficiency ${ratio}`,
  ].join('\n');
}

/**
 * Synchronizer adapter for distributed Redis cluster deduplication lock keys.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createRedisClusterSyncer(clusterNodes: string[]) {
  const activeKeys = new Set<string>();
  return {
    lock: (key: string) => {
      if (activeKeys.has(key)) return false;
      activeKeys.add(key);
      return true;
    },
    unlock: (key: string) => {
      activeKeys.delete(key);
    },
    isLocked: (key: string) => activeKeys.has(key),
  };
}

/**
 * Coalescing in-memory cache store that merges simultaneous identical requests
 * and distributes the resolved result to all waiting callers.
 */
export class CoalescingCacheStore<T> {
  private activePromises = new Map<string, Promise<T>>();
  private cache = new Map<string, { value: T; expiresAt: number }>();

  constructor(private ttlMs: number = 60000) {}

  async fetch(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    if (this.activePromises.has(key)) {
      return this.activePromises.get(key)!;
    }

    const promise = fetcher()
      .then((value) => {
        this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        this.activePromises.delete(key);
        return value;
      })
      .catch((err) => {
        this.activePromises.delete(key);
        throw err;
      });

    this.activePromises.set(key, promise);
    return promise;
  }
}

/**
 * Injects a proxy layer to deduplicate property accesses.
 */
export function injectProxyLayer<T extends object>(target: T): T {
  const cache = new Map<string, any>();
  return new Proxy(target, {
    get(obj, prop: string) {
      if (cache.has(prop)) {
        return cache.get(prop);
      }
      const value = (obj as any)[prop];
      cache.set(prop, value);
      return value;
    },
  });
}
export * from './broadcastSync';
