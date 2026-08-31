import { describe, it, expect } from 'vitest';
import { CircuitStateMachine } from './circuitStateMachine';

describe('CircuitStateMachine', () => {
  it('should transition to OPEN after failures', () => {
    const circuit = new CircuitStateMachine({ failureThreshold: 2 });
    expect(circuit.canRequest()).toBe(true);
    circuit.recordFailure();
    circuit.recordFailure();
    expect(circuit.getState()).toBe('OPEN');
    expect(circuit.canRequest()).toBe(false);
  });
});
