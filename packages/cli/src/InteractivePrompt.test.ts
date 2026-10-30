import { describe, it, expect } from 'vitest';
import { InteractivePrompt } from './InteractivePrompt';

describe('InteractivePrompt', () => {
  it('should return preset answer or default', () => {
    const prompt = new InteractivePrompt();
    prompt.preset('Target folder?', 'src/');

    expect(prompt.ask('Target folder?')).toBe('src/');
    expect(prompt.ask('Mode?', { defaultValue: 'strict' })).toBe('strict');
  });

  it('should validate answer and throw when invalid', () => {
    const prompt = new InteractivePrompt();
    prompt.preset('Port?', 'invalid-port');

    expect(() =>
      prompt.ask('Port?', {
        validate: (val) => (!isNaN(Number(val)) ? true : 'Port must be a number'),
      }),
    ).toThrow('Port must be a number');
  });

  it('should enforce choices', () => {
    const prompt = new InteractivePrompt();
    prompt.preset('Format?', 'xml');

    expect(() => prompt.ask('Format?', { choices: ['json', 'csv'] })).toThrow('Invalid choice');
  });
});
