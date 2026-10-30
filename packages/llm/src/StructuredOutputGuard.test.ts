import { describe, it, expect } from 'vitest';
import { StructuredOutputGuard } from './StructuredOutputGuard';

describe('StructuredOutputGuard', () => {
  it('should extract JSON from markdown code fence and purify nulls', () => {
    const raw = `
Here is the requested user data:
\`\`\`json
{
  "id": 101,
  "name": "Bob",
  "deprecatedField": null,
  "nested": {
    "tags": ["ai", null],
    "empty": undefined
  },
}
\`\`\`
Hope this helps!`;

    const cleaned = StructuredOutputGuard.extractAndPurify<any>(raw);
    expect(cleaned.id).toBe(101);
    expect(cleaned.name).toBe('Bob');
    expect(cleaned.deprecatedField).toBeUndefined();
    expect(cleaned.nested.tags).toEqual(['ai']);
  });

  it('should extract JSON surrounded by normal conversational text', () => {
    const text =
      'Sure, the result is {"status": "ok", "error": null}. Let me know if you need more!';
    const result = StructuredOutputGuard.extractAndPurify<any>(text);
    expect(result.status).toBe('ok');
    expect(result.error).toBeUndefined();
  });
});
