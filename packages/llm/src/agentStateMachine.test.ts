import { describe, it, expect } from 'vitest';
import { AgentStateMachine } from './agentStateMachine';

describe('AgentStateMachine', () => {
  it('should transition properly', () => {
    const agent = new AgentStateMachine('Analyze code');
    expect(agent.getState()).toBe('IDLE');
    
    agent.transition('THINKING', 'Planning steps');
    expect(agent.getState()).toBe('THINKING');
    expect(agent.getContext().memory.lastThought).toBe('Planning steps');
    
    agent.transition('ERROR', new Error('Fail'));
    expect(() => agent.transition('EXECUTING')).toThrow();
  });
});
