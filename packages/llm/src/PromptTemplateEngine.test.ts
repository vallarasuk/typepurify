import { describe, it, expect } from 'vitest';
import { PromptTemplateEngine } from './PromptTemplateEngine';

describe('PromptTemplateEngine', () => {
  it('should interpolate flat and dot-nested variables', () => {
    const engine = new PromptTemplateEngine();
    const template = 'Hello {{ user.name }}, your score is {{ stats.score }}. Active: {{ active }}';
    const result = engine.render(template, {
      user: { name: 'Alice' },
      stats: { score: 0 },
      active: false,
    });

    expect(result).toBe('Hello Alice, your score is 0. Active: false');
  });

  it('should throw in strict mode when variable is missing', () => {
    const engine = new PromptTemplateEngine();
    expect(() => engine.render('Welcome {{ user.email }}', {}, { strict: true })).toThrow(
      'Missing required template variable: user.email',
    );
  });

  it('should use fallback when variable is missing in non-strict mode', () => {
    const engine = new PromptTemplateEngine();
    const result = engine.render('Welcome {{ missing }}', {}, { fallback: 'Guest' });
    expect(result).toBe('Welcome Guest');
  });
});
