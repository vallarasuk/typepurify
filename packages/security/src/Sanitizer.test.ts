import { describe, it, expect } from 'vitest';
import { Sanitizer } from './Sanitizer';
describe('Sanitizer', () => {
  it('should sanitize', () => {
    const s = new Sanitizer();
    expect(s.sanitize('html')).toBe('html');
  });
});
