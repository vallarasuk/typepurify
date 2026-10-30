export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState) => void;
}

/**
 * Stateful circuit breaker that fast-fails requests once error threshold is exceeded.
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureThreshold: number;
  private resetTimeoutMs: number;
  private failureCount = 0;
  private lastFailureTime = 0;
  private onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState) => void;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 5000;
    this.onStateChange = options.onStateChange;
  }

  getState(): CircuitBreakerState {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.transitionTo('HALF_OPEN');
      }
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T> | T): Promise<T> {
    const currentState = this.getState();
    if (currentState === 'OPEN') {
      throw new Error('CircuitBreaker is OPEN: fast failing call');
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      return result;
    } catch (err) {
      this.handleFailure();
      throw err;
    }
  }

  private handleFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    }
  }

  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    if (oldState !== newState) {
      this.state = newState;
      this.onStateChange?.(oldState, newState);
    }
  }

  reset(): void {
    this.failureCount = 0;
    this.transitionTo('CLOSED');
  }

  trip(): void {
    this.lastFailureTime = Date.now();
    this.transitionTo('OPEN');
  }
}
