export interface RetryOptions {
  /** Number of maximum retries (default: 3) */
  retries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  delay?: number;
  /** Optional callback when a retry happens */
  onRetry?: (error: Error, attempt: number) => void;
  /** Custom logic to determine if we should retry (default: always true) */
  shouldRetry?: (error: Error) => boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps an asynchronous function with robust retry logic.
 *
 * @param fn The async function to execute.
 * @param options Configuration for retries.
 * @returns The resolved value of the async function.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  const delay = options.delay ?? 1000;

  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;

      if (attempt > retries) {
        throw error;
      }

      if (options.shouldRetry && !options.shouldRetry(error)) {
        throw error;
      }

      if (options.onRetry) {
        options.onRetry(error, attempt);
      }

      await sleep(delay);
    }
  }
}
