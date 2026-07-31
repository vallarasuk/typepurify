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
      // Fast path: single primitive argument (very common in API fetching)
      if (args.length === 1 && typeof args[0] !== 'object' && typeof args[0] !== 'function') {
        key = String(args[0]);
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
      ongoingPromises.delete(key);
      cachedResults.delete(key);
      if (debounceTimers.has(key)) {
        clearTimeout(debounceTimers.get(key));
        debounceTimers.delete(key);
      }
      pendingResolvers.delete(key);
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
  keyGenerator: (...args: any[]) => string = (...args) => JSON.stringify(args),
): T {
  const cache = new Map<string, any>();
  return function (...args: any[]) {
    const key = keyGenerator(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * Deduplicates an asynchronous generator function.
 * If multiple callers invoke the generator with the same arguments simultaneously,
 * it will only execute the underlying generator once and broadcast the yielded chunks to all callers.
 */
export function dedupeAsyncGenerator<T, Args extends any[]>(
  genFn: (...args: Args) => AsyncGenerator<T, void, unknown>,
  keyGenerator: (...args: Args) => string = (...args) => JSON.stringify(args),
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
