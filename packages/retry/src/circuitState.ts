// @typepurify/retry - Circuit State Machine
export enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

export class CircuitStateMachine {
  public state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private nextAttempt = 0;

  constructor(
    private threshold: number = 3,
    private timeoutMs: number = 5000,
  ) {}

  public recordFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.timeoutMs;
    }
  }

  public recordSuccess(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  public canAttempt(): boolean {
    if (this.state === CircuitState.CLOSED) return true;
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextAttempt) {
        this.state = CircuitState.HALF_OPEN;
        return true;
      }
      return false;
    }
    return true; // HALF_OPEN
  }
}
