export class CircuitBreaker {
  execute(fn: Function) {
    return fn();
  }
}
