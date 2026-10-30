/**
 * High-performance string and HTML XSS sanitizer.
 */
export class Sanitizer {
  sanitize(input: string): string {
    if (typeof input !== 'string') return input;

    // Remove script tags and contents
    let cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Remove inline event handlers (e.g. onload=..., onclick=...)
    cleaned = cleaned.replace(/\s+on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
    // Neutralize javascript: and data: URLs
    cleaned = cleaned.replace(/(javascript|data|vbscript):/gi, '$1_safe:');
    // HTML entity escaping
    return cleaned
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  stripHtml(input: string): string {
    if (typeof input !== 'string') return input;
    return input.replace(/<[^>]*>/g, '').trim();
  }
}
