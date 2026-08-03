export interface RetryOptions {
  /** Number of maximum retries (default: 3) */
  retries?: number;
  /** Initial delay between retries in milliseconds (default: 1000) */
  delay?: number;
  /** Backoff algorithm (default: 'fixed') */
  backoff?: 'fixed' | 'exponential';
  /** Whether to add jitter to the delay (default: false) */
  jitter?: boolean;
  /** Maximum time in milliseconds allowed for the entire execution including retries */
  timeout?: number;
  /** Optional callback when a retry happens */
  onRetry?: (error: Error, attempt: number) => void;
  /** Custom logic to determine if we should retry (default: always true) */
  shouldRetry?: (error: Error) => boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class RetryExhaustedError extends Error {
  constructor(
    message: string,
    public readonly lastError?: Error,
  ) {
    super(message);
    this.name = 'RetryExhaustedError';
  }
}

/**
 * Wraps an asynchronous function with robust retry logic.
 *
 * @param fn The async function to execute. Can optionally take an AbortSignal.
 * @param options Configuration for retries.
 * @returns The resolved value of the async function.
 */
export async function withRetry<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const retries = options.retries ?? 3;
  const initialDelay = options.delay ?? 1000;
  const backoff = options.backoff ?? 'fixed';
  const jitter = options.jitter ?? false;

  let attempt = 0;
  const startTime = Date.now();

  const executeWithTimeout = async () => {
    if (options.timeout !== undefined) {
      const timeRemaining = options.timeout - (Date.now() - startTime);
      if (timeRemaining <= 0) {
        throw new TimeoutError('Operation timed out');
      }

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      let timeoutId: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          controller?.abort();
          reject(new TimeoutError('Operation timed out'));
        }, timeRemaining);
      });

      try {
        const result = await Promise.race([fn(controller?.signal), timeoutPromise]);
        clearTimeout(timeoutId);
        return result;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    }
    return fn();
  };

  while (attempt <= retries) {
    try {
      return await executeWithTimeout();
    } catch (error: any) {
      attempt++;

      if (error.name === 'TimeoutError' || attempt > retries) {
        throw error;
      }

      if (options.shouldRetry && !options.shouldRetry(error)) {
        throw error;
      }

      if (options.onRetry) {
        options.onRetry(error, attempt);
      }

      let currentDelay =
        backoff === 'exponential' ? initialDelay * Math.pow(2, attempt - 1) : initialDelay;

      if (jitter) {
        // Add random jitter between 0 and currentDelay
        currentDelay = Math.random() * currentDelay;
      }

      // Ensure sleep honors the overall timeout if defined
      if (options.timeout !== undefined) {
        const timeRemaining = options.timeout - (Date.now() - startTime);
        if (timeRemaining <= 0) {
          throw new TimeoutError('Operation timed out');
        }
        currentDelay = Math.min(currentDelay, timeRemaining);
      }

      await sleep(currentDelay);
    }
  }
  throw new Error('Unreachable');
}

/**
 * Alias for withRetry
 */
export const retry = withRetry;

export interface CircuitBreakerOptions {
  failureThreshold?: number; // How many failures before tripping (default 5)
  resetTimeout?: number; // How long to wait in Open state before trying again (Half-Open) (ms) (default 10000)
}

/**
 * A basic Circuit Breaker implementation.
 * States:
 * CLOSED: Normal operation, passing calls through.
 * OPEN: Failing operation, immediately rejecting calls.
 * HALF_OPEN: Testing if operation has recovered.
 */
export class CircuitBreaker {
  private failureThreshold: number;
  private resetTimeout: number;

  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private nextAttempt = 0;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 10000;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('CircuitBreaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }

  getState() {
    return this.state;
  }
}

/**
 * Advanced exponential backoff algorithm with jitter to prevent retry collisions.
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1)
        throw new RetryExhaustedError('Exponential retry failed', err as Error);
      const jitter = Math.random() * 200;
      await new Promise((res) => setTimeout(res, delay * Math.pow(2, i) + jitter));
    }
  }
  throw new RetryExhaustedError('Exponential retry failed');
}

/**
 * Linear backoff retry function that increases delay linearly by stepMs for each attempt.
 */
export async function withLinearBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  stepMs = 100,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw new RetryExhaustedError('Linear retry failed', err as Error);
      await new Promise((res) => setTimeout(res, (i + 1) * stepMs));
    }
  }
  throw new RetryExhaustedError('Linear retry failed');
}

/**
 * Fibonacci backoff retry function that increases delay based on the Fibonacci sequence.
 */
export async function withFibonacciBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 100,
): Promise<T> {
  let a = 1;
  let b = 1;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw new RetryExhaustedError('Fibonacci retry failed', err as Error);
      const delay = a * baseDelay;
      const next = a + b;
      a = b;
      b = next;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('Fibonacci retry failed');
}

/**
 * Retries an async generator (e.g. streaming API requests).
 */
export async function* withRetryAsyncGenerator<T>(
  fn: () => AsyncGenerator<T, void, unknown>,
  retries = 3,
  delay = 1000,
): AsyncGenerator<T, void, unknown> {
  let attempt = 0;
  while (true) {
    try {
      const generator = fn();
      for await (const item of generator) {
        yield item;
      }
      return; // Success
    } catch (err) {
      if (attempt >= retries) throw err;
      attempt++;
      await new Promise((res) => setTimeout(res, delay * Math.pow(2, attempt - 1)));
    }
  }
}

/**
 * Lock mechanism to synchronize retries across asynchronous worker tasks.
 */
export class RetryLock {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (this.locked) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.locked = true;
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
    } else {
      this.locked = false;
    }
  }

  isLocked(): boolean {
    return this.locked;
  }

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * Event emitter listener engine for tracking retry attempts, failures, and completions.
 */
export class RetryEventEmitter {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  on(event: 'retry' | 'success' | 'failure', listener: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: 'retry' | 'success' | 'failure', listener: (...args: any[]) => void): void {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(
      event,
      list.filter((l) => l !== listener),
    );
  }

  emit(event: 'retry' | 'success' | 'failure', ...args: any[]): void {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach((l) => l(...args));
    }
  }
}
