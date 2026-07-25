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
  const cachedResults = new Map<string, { value: any; expiresAt: number }>();
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
