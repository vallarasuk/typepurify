export interface RateLimiterOptions {
  /** Maximum number of requests allowed in the time window */
  maxRequests?: number;
  /** The time window in milliseconds */
  timeWindowMs?: number;
  /** Whether to block execution until a token is available */
  blockWait?: boolean;
}

export class RateLimiter {
  private maxRequests: number;
  private timeWindowMs: number;
  private blockWait: boolean;

  private tokens: number;
  private lastRefillTime: number;
  private queue: Array<() => void> = [];

  constructor(options: RateLimiterOptions = {}) {
    this.maxRequests = options.maxRequests ?? 100;
    this.timeWindowMs = options.timeWindowMs ?? 60000;
    this.blockWait = options.blockWait ?? true;

    this.tokens = this.maxRequests;
    this.lastRefillTime = Date.now();
  }

  /**
   * Refills the token bucket based on elapsed time.
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsedTime = now - this.lastRefillTime;

    if (elapsedTime > this.timeWindowMs) {
      this.tokens = this.maxRequests;
      this.lastRefillTime = now;
    } else {
      // Calculate fractional tokens based on elapsed time
      const refillAmount = Math.floor((elapsedTime / this.timeWindowMs) * this.maxRequests);
      if (refillAmount > 0) {
        this.tokens = Math.min(this.maxRequests, this.tokens + refillAmount);
        this.lastRefillTime = now;
      }
    }
  }

  /**
   * Process pending queued requests if tokens are available.
   */
  private processQueue(): void {
    this.refillTokens();
    while (this.queue.length > 0 && this.tokens > 0) {
      this.tokens--;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }

    if (this.queue.length > 0) {
      // Schedule next check
      const nextAvailableTime = this.timeWindowMs / this.maxRequests;
      setTimeout(() => this.processQueue(), nextAvailableTime);
    }
  }

  /**
   * Acquires a token, blocking if necessary (and configured to do so).
   * @throws Error if limits are reached and blockWait is false.
   */
  async acquire(): Promise<void> {
    this.refillTokens();

    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }

    if (!this.blockWait) {
      throw new Error('[RateLimiter] Rate limit exceeded and blockWait is false.');
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);

      // Start processing queue if this is the first item
      if (this.queue.length === 1) {
        const nextAvailableTime = this.timeWindowMs / this.maxRequests;
        setTimeout(() => this.processQueue(), nextAvailableTime);
      }
    });
  }

  /**
   * Syncs the rate limiter state from external headers (e.g. RateLimit-Remaining).
   */
  syncState(remaining: number, resetTimestamp?: number): void {
    this.tokens = Math.min(this.maxRequests, Math.max(0, remaining));
    if (resetTimestamp) {
      // If we are given an explicit reset timestamp, adjust our time window manually
      const resetDelay = Math.max(0, resetTimestamp - Date.now());
      this.timeWindowMs = resetDelay;
      this.lastRefillTime = Date.now();
    }
  }
}
