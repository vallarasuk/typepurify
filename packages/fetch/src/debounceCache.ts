// @typepurify/fetch - Debounce Cache Layer
type FetchLike = (...args: any[]) => Promise<any>;

export function debounceCache<T extends FetchLike>(fetcher: T, debounceMs = 300): T {
  const cache = new Map<string, { promise: Promise<any>; timestamp: number }>();

  return (async (...args: any[]) => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && now - cached.timestamp < debounceMs) {
      return cached.promise;
    }

    const promise = fetcher(...args);
    cache.set(key, { promise, timestamp: now });

    try {
      return await promise;
    } catch (err) {
      cache.delete(key);
      throw err;
    }
  }) as T;
}
