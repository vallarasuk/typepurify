import { describe, it, expect } from 'vitest';
import { InteractivePrompt } from './InteractivePrompt';
describe('InteractivePrompt', () => {
  it('should ask a question', () => {
    const prompt = new InteractivePrompt();
    expect(prompt.ask('Q?')).toBe('answer');
  });
});
