import { describe, it, expect } from 'vitest';
import { Sanitizer } from './Sanitizer';

describe('Sanitizer', () => {
  it('should strip script tags and escape HTML entities', () => {
    const s = new Sanitizer();
    const malicious = '<script>alert("xss")</script><b onclick="evil()">Hello</b> & "world"';
    const clean = s.sanitize(malicious);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onclick');
    expect(clean).toContain('&lt;b&gt;Hello&lt;/b&gt;');
    expect(clean).toContain('&amp;');
    expect(clean).toContain('&quot;world&quot;');
  });

  it('should strip plain HTML tags using stripHtml', () => {
    const s = new Sanitizer();
    expect(s.stripHtml('<p>Safe <strong>text</strong></p>')).toBe('Safe text');
  });
});
