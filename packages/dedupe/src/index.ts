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
}

/**
 * Wraps an asynchronous function to deduplicate identical ongoing calls,
 * with optional debouncing support.
 *
 * @param fn The async function to deduplicate/debounce
 * @param options Configuration options
 * @returns The wrapped deduplicated async function
 */
export function dedupe<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: DedupeOptions = {},
): T {
  const ongoingPromises = new Map<string, Promise<any>>();
  const debounceTimers = new Map<string, any>();
  const pendingResolvers = new Map<
    string,
    { resolve: (val: any) => void; reject: (err: any) => void }[]
  >();

  return (async (...args: any[]) => {
    const key = options.keyGenerator ? options.keyGenerator(...args) : JSON.stringify(args);

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
            promise = fn(...args).finally(() => {
              ongoingPromises.delete(key);
            });
            ongoingPromises.set(key, promise);
          }

          promise.then(
            (val) => resolvers.forEach((r) => r.resolve(val)),
            (err) => resolvers.forEach((r) => r.reject(err)),
          );
        }, options.debounce);

        debounceTimers.set(key, timer);
      });
    } else {
      if (ongoingPromises.has(key)) {
        return ongoingPromises.get(key)!;
      }

      const promise = fn(...args).finally(() => {
        ongoingPromises.delete(key);
      });

      ongoingPromises.set(key, promise);
      return promise;
    }
  }) as unknown as T;
}
