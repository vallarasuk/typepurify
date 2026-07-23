export interface DedupeOptions {
  /**
   * Custom function to generate a cache key from the arguments.
   * If not provided, `JSON.stringify(args)` is used.
   */
  keyGenerator?: (...args: any[]) => string;
}

/**
 * Wraps an asynchronous function to deduplicate identical ongoing calls.
 * If a call is made while an identical call (based on arguments) is already in flight,
 * it returns the same promise instead of executing the function again.
 *
 * @param fn The async function to deduplicate
 * @param options Deduplication options
 * @returns The wrapped deduplicated async function
 */
export function dedupe<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: DedupeOptions = {},
): T {
  const ongoingPromises = new Map<string, Promise<any>>();

  return (async (...args: any[]) => {
    const key = options.keyGenerator ? options.keyGenerator(...args) : JSON.stringify(args);

    if (ongoingPromises.has(key)) {
      return ongoingPromises.get(key)!;
    }

    const promise = fn(...args).finally(() => {
      ongoingPromises.delete(key);
    });

    ongoingPromises.set(key, promise);
    return promise;
  }) as unknown as T;
}
