export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitStateMachineOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenMaxCalls?: number;
}

/**
 * A robust Circuit Breaker state machine for @typepurify/retry.
 * It prevents cascading failures by stopping requests when a downstream service is failing.
 */
export class CircuitStateMachine {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailureTime: number | null = null;
  private halfOpenCalls = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenMaxCalls: number;

  constructor(options: CircuitStateMachineOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.halfOpenMaxCalls = options.halfOpenMaxCalls ?? 2;
  }

  /**
   * Evaluates the current state and returns whether a request should be allowed.
   */
  public canRequest(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      const now = Date.now();
      if (this.lastFailureTime && now - this.lastFailureTime > this.resetTimeoutMs) {
        this.transitionTo('HALF_OPEN');
        return true;
      }
      return false;
    }

    if (this.state === 'HALF_OPEN') {
      return this.halfOpenCalls < this.halfOpenMaxCalls;
    }

    return false;
  }

  /**
   * Records a successful request.
   */
  public recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('CLOSED');
    } else if (this.state === 'CLOSED') {
      this.failures = 0;
    }
  }

  /**
   * Records a failed request.
   */
  public recordFailure(): void {
    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      this.failures++;
      if (this.failures >= this.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    this.state = newState;
    if (newState === 'OPEN') {
      this.lastFailureTime = Date.now();
    } else if (newState === 'HALF_OPEN') {
      this.halfOpenCalls = 0;
    } else if (newState === 'CLOSED') {
      this.failures = 0;
      this.lastFailureTime = null;
    }
  }

  public getState(): CircuitState {
    return this.state;
  }
}
