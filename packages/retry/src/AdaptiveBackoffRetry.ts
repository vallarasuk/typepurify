export interface AdaptiveRetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delayMs: number) => void;
}

/**
 * AdaptiveBackoffRetry implements exponential backoff with full jitter to eliminate thundering herds.
 */
export class AdaptiveBackoffRetry {
  private maxAttempts: number;
  private baseDelayMs: number;
  private maxDelayMs: number;
  private shouldRetry: (error: any, attempt: number) => boolean;
  private onRetry?: (error: any, attempt: number, delayMs: number) => void;

  constructor(options: AdaptiveRetryOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 50;
    this.maxDelayMs = options.maxDelayMs ?? 2000;
    this.shouldRetry = options.shouldRetry ?? (() => true);
    this.onRetry = options.onRetry;
  }

  async run<T>(fn: (attempt: number) => Promise<T> | T): Promise<T> {
    let attempt = 1;
    let lastError: any;

    while (attempt <= this.maxAttempts) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastError = err;
        if (attempt >= this.maxAttempts || !this.shouldRetry(err, attempt)) {
          throw err;
        }

        // Full Jitter: random between 0 and min(maxDelay, baseDelay * 2^(attempt-1))
        const expDelay = Math.min(this.maxDelayMs, this.baseDelayMs * Math.pow(2, attempt - 1));
        const jitterDelay = Math.floor(Math.random() * expDelay);

        this.onRetry?.(err, attempt, jitterDelay);
        await new Promise((resolve) => setTimeout(resolve, jitterDelay));
        attempt++;
      }
    }

    throw lastError ?? new Error('Retry exhausted');
  }
}
