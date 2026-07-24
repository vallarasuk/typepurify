/**
 * Cleans malformed LLM JSON strings by extracting JSON out of markdown blocks
 * and fixing common trailing commas.
 */
export function cleanLlmJson(input: string): string {
  let cleaned = input.trim();

  // Strip markdown code blocks
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    cleaned = match[1].trim();
  }

  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

  return cleaned;
}

/**
 * A simple prompt template manager.
 */
export class PromptTemplate {
  constructor(private template: string) {}

  render(variables: Record<string, string | number>): string {
    let result = this.template;
    for (const [key, value] of Object.entries(variables)) {
      // Replace all instances of {{key}}
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    }
    return result;
  }
}

/**
 * Rough token counter using character approximation.
 * E.g., OpenAI/Claude is usually ~4 chars per token.
 */
export function countTokens(
  text: string,
  model: 'openai' | 'claude' | 'gemini' = 'openai',
): number {
  const chars = text.length;
  // Very rough approximations for fallback without heavy tokenizers
  switch (model) {
    case 'gemini':
      return Math.ceil(chars / 3.5);
    case 'claude':
      return Math.ceil(chars / 3.8);
    case 'openai':
    default:
      return Math.ceil(chars / 4.0);
  }
}

/**
 * Parses Server-Sent Events (SSE) chunks commonly used in LLM streaming.
 */
export function* parseAiStream(chunk: string): Generator<string, void, unknown> {
  const lines = chunk.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
      try {
        const payload = line.slice(6);
        yield payload;
      } catch {
        // Ignore malformed chunks
      }
    }
  }
}
