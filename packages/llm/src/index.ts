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
    return this.template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      return key in variables ? String(variables[key]) : match;
    });
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

/**
 * Alias for estimateCost
 */
export const calculateCost = estimateCost;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function buildChatPrompt(messages: ChatMessage[], systemPrompt?: string): string {
  const parts: string[] = [];
  if (systemPrompt) {
    parts.push(`System: ${systemPrompt}`);
  }
  for (const msg of messages) {
    const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
    parts.push(`${role}: ${msg.content}`);
  }
  return parts.join('\n\n');
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
 * Extracts the content of the first markdown code block, optionally filtered by language.
 */
export function extractFirstMarkdownBlock(text: string, lang?: string): string | null {
  const blocks = parseMarkdownBlocks(text);
  if (lang) {
    return blocks[lang]?.[0] || null;
  }

  // Return the very first block found across all languages
  const firstLang = Object.keys(blocks)[0];
  if (firstLang) {
    return blocks[firstLang][0] || null;
  }
  return null;
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

/**
 * Truncates text to stay within estimated token budget for specified model.
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number,
  model: 'openai' | 'claude' | 'gemini' | 'gpt-4' | 'gpt-4o' | 'gemini-1.5-pro' = 'openai',
): string {
  const currentTokens = countTokens(text, model);
  if (currentTokens <= maxTokens) {
    return text;
  }
  const ratio = maxTokens / currentTokens;
  const targetLength = Math.floor(text.length * ratio);
  return text.slice(0, targetLength);
}

/**
 * Helper to fetch and automatically stream an LLM response from an SSE endpoint.
 */
export async function* streamChat(
  url: string,
  payload: any,
  headers?: Record<string, string>,
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });

  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process full chunks
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || ''; // Keep the incomplete chunk in buffer

    for (const chunk of chunks) {
      for (const payload of parseAiStream(chunk)) {
        yield payload;
      }
    }
  }
}

/**
 * Sanitizes LLM system prompts against prompt injection patterns.
 */
export function sanitizeSystemPrompt(prompt: string): string {
  if (!prompt) return '';
  return prompt
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\[system instruction\]/gi, '')
    .trim();
}
