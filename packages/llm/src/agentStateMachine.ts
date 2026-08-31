export type AgentState = 'IDLE' | 'THINKING' | 'EXECUTING' | 'WAITING' | 'ERROR';

export interface AgentContext {
  task: string;
  memory: Record<string, any>;
  errors: Error[];
}

/**
 * Agent State Machine for @typepurify/llm.
 * Manages the internal execution loop for autonomous LLM agents.
 */
export class AgentStateMachine {
  private state: AgentState = 'IDLE';
  private context: AgentContext;

  constructor(initialTask: string) {
    this.context = { task: initialTask, memory: {}, errors: [] };
  }

  public transition(newState: AgentState, payload?: any): void {
    if (this.state === 'ERROR' && newState !== 'IDLE') {
      throw new Error('Cannot transition from ERROR to anything but IDLE.');
    }
    
    this.state = newState;
    if (payload && this.state === 'THINKING') {
      this.context.memory.lastThought = payload;
    } else if (payload && this.state === 'ERROR') {
      this.context.errors.push(payload);
    }
  }

  public getState(): AgentState {
    return this.state;
  }

  public getContext(): AgentContext {
    return this.context;
  }
}
