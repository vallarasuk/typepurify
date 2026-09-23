import { describe, it, expect } from 'vitest';
import { PromptTemplateEngine } from './PromptTemplateEngine';
describe('PromptTemplateEngine', () => {
  it('should render', () => {
    const e = new PromptTemplateEngine();
    expect(e.render('hi', {})).toBe('hi');
  });
});
