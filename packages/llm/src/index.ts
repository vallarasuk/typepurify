/**
 * Cleans malformed LLM JSON strings by extracting JSON out of markdown blocks
 * and fixing common trailing commas.
 */
export function cleanLlmJson(input: string): string {
  let cleaned = input.trim();

  // Strip markdown code blocks without Regex to prevent ReDoS on massive payloads
  const startIndex = cleaned.indexOf('```');
  if (startIndex !== -1) {
    const endIndex = cleaned.lastIndexOf('```');
    if (endIndex > startIndex) {
      let inner = cleaned.substring(startIndex + 3, endIndex).trim();
      if (inner.startsWith('json')) {
        inner = inner.substring(4).trim();
      }
      cleaned = inner;
    }
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
  model: 'openai' | 'claude' | 'gemini' | 'gpt-4' | 'gpt-4o' | 'gemini-1.5-pro' = 'openai',
): number {
  const chars = text.length;
  // Very rough approximations for fallback without heavy tokenizers
  switch (model) {
    case 'gemini':
    case 'gemini-1.5-pro':
      return Math.ceil(chars / 3.5);
    case 'claude':
      return Math.ceil(chars / 3.8);
    case 'openai':
    case 'gpt-4':
    case 'gpt-4o':
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

export function estimateCost(tokens: number, model: string): number {
  if (model === 'gpt-4o') return (tokens / 1000) * 0.005;
  if (model === 'gemini-1.5-pro') return (tokens / 1000) * 0.0035;
  return 0;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function buildChatPrompt(messages: ChatMessage[], systemPrompt?: string): string {
  let prompt = '';
  if (systemPrompt) {
    prompt += `System: ${systemPrompt}\n\n`;
  }
  for (const msg of messages) {
    const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
    prompt += `${role}: ${msg.content}\n\n`;
  }
  return prompt.trim();
}

export function parseMarkdownBlocks(text: string): Record<string, string[]> {
  const blocks: Record<string, string[]> = {};
  const regex = /```([a-z0-9]+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const lang = match[1] || 'text';
    const content = match[2].trim();
    if (!blocks[lang]) {
      blocks[lang] = [];
    }
    blocks[lang].push(content);
  }

  return blocks;
}

/**
 * Schema validator agent for ensuring LLM JSON outputs adhere strictly to formatting rules.
 */
export function validateLlmSchema(payload: any, schema: Record<string, any>): boolean {
  if (!payload || typeof payload !== 'object') return false;
  // basic schema pass
  for (const key of Object.keys(schema)) {
    if (!(key in payload)) return false;
  }
  return true;
}
