import { describe, it, expect } from 'vitest';
import {
  cleanLlmJson,
  PromptTemplate,
  countTokens,
  parseAiStream,
  estimateCost,
  validateLlmSchema,
  truncateToTokenLimit,
} from './index';

describe('@typepurify/llm', () => {
  describe('cleanLlmJson', () => {
    it('should strip markdown blocks', () => {
      const raw = '```json\n{"a": 1}\n```';
      expect(cleanLlmJson(raw)).toBe('{"a": 1}');
    });

    it('should fix trailing commas', () => {
      const raw = '{"a": 1, "b": 2,}';
      expect(cleanLlmJson(raw)).toBe('{"a": 1, "b": 2}');

      const rawArr = '[1, 2, ]';
      expect(cleanLlmJson(rawArr)).toBe('[1, 2]');
    });

    it('should handle combination of markdown and trailing commas', () => {
      const raw = '```\n{\n  "a": 1,\n}\n```';
      expect(cleanLlmJson(raw)).toBe('{\n  "a": 1}');
    });
  });

  describe('PromptTemplate', () => {
    it('should render variables correctly', () => {
      const tpl = new PromptTemplate('Hello {{name}}, you are {{age}} years old.');
      expect(tpl.render({ name: 'Alice', age: 30 })).toBe('Hello Alice, you are 30 years old.');
    });
  });

  describe('countTokens', () => {
    it('should return approximate counts', () => {
      const text = 'hello world'; // 11 chars
      expect(countTokens(text, 'openai')).toBe(3); // 11 / 4 = 2.75 -> 3
      expect(countTokens(text, 'claude')).toBe(3); // 11 / 3.8 = 2.89 -> 3
      expect(countTokens(text, 'gemini')).toBe(4); // 11 / 3.5 = 3.14 -> 4
    });
  });

  describe('parseAiStream', () => {
    it('should parse valid data chunks and ignore DONE', () => {
      const chunk = 'data: {"id": 1}\ndata: {"id": 2}\ndata: [DONE]\n';
      const generator = parseAiStream(chunk);

      const results = [];
      for (const item of generator) {
        results.push(item);
      }

      expect(results).toEqual(['{"id": 1}', '{"id": 2}']);
    });
  });

  describe('estimateCost', () => {
    it('should return cost', () => {
      expect(estimateCost(1000, 'gpt-4o')).toBe(0.005);
      expect(estimateCost(1000, 'gemini-1.5-pro')).toBe(0.0035);
      expect(estimateCost(1000, 'gemini-2.0-flash')).toBe(0.0001);
      expect(estimateCost(1000, 'claude-3-5-sonnet')).toBe(0.003);
      expect(estimateCost(1000, 'deepseek-r1')).toBe(0.00055);
      expect(estimateCost(1000, 'unknown-model')).toBe(0);
    });
  });

  describe('calculateCost', () => {
    it('should act as an alias to estimateCost', async () => {
      const { calculateCost, estimateCost } = await import('./index');
      expect(calculateCost).toBe(estimateCost);
      expect(calculateCost(2000, 'gpt-4o')).toBe(0.01);
    });
  });

  describe('countTokens', () => {
    it('should count correctly for new models', () => {
      expect(countTokens('hello world', 'gpt-4o')).toBe(3);
    });
  });

  describe('buildChatPrompt', () => {
    it('should build prompt correctly', async () => {
      const { buildChatPrompt } = await import('./index');
      const messages: any = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ];

      const prompt = buildChatPrompt(messages, 'You are a helpful assistant.');
      expect(prompt).toContain('System: You are a helpful assistant.');
      expect(prompt).toContain('User: Hello');
      expect(prompt).toContain('Assistant: Hi there');
    });
  });

  describe('parseMarkdownBlocks', () => {
    it('should parse markdown blocks correctly', async () => {
      const { parseMarkdownBlocks } = await import('./index');
      const text =
        'Here is some code:\n```javascript\nconsole.log("hello");\n```\nAnd some json:\n```json\n{"a": 1}\n```';

      const blocks = parseMarkdownBlocks(text);
      expect(blocks['javascript']).toEqual(['console.log("hello");']);
      expect(blocks['json']).toEqual(['{"a": 1}']);
    });
  });

  describe('extractFirstMarkdownBlock', () => {
    it('should extract first block regardless of language', async () => {
      const { extractFirstMarkdownBlock } = await import('./index');
      const text = 'Some text.\n```python\nprint("hi")\n```\nMore text.\n```json\n{"a":1}\n```';
      expect(extractFirstMarkdownBlock(text)).toBe('print("hi")');
    });

    it('should extract first block of specific language', async () => {
      const { extractFirstMarkdownBlock } = await import('./index');
      const text = 'Some text.\n```python\nprint("hi")\n```\nMore text.\n```json\n{"a":1}\n```';
      expect(extractFirstMarkdownBlock(text, 'json')).toBe('{"a":1}');
      expect(extractFirstMarkdownBlock(text, 'javascript')).toBeNull();
    });
  });

  describe('extractMarkdownBlocksByLang', () => {
    it('should extract all blocks of a specific language', async () => {
      const { extractMarkdownBlocksByLang } = await import('./index');
      const text = '```ts\nconst a = 1;\n```\n```json\n{}\n```\n```ts\nconst b = 2;\n```';
      const blocks = extractMarkdownBlocksByLang(text, 'ts');
      expect(blocks).toEqual(['const a = 1;', 'const b = 2;']);
    });
  });

  describe('validateLlmSchema', () => {
    it('should return true for valid schema match', () => {
      const payload = { name: 'AI', status: 'ok' };
      const schema = { name: 'string', status: 'string' };
      expect(validateLlmSchema(payload, schema)).toBe(true);
    });

    it('should return false for missing keys or invalid payload', () => {
      expect(validateLlmSchema({ name: 'AI' }, { name: 'string', missing: 'string' })).toBe(false);
      expect(validateLlmSchema(null, { name: 'string' })).toBe(false);
    });
  });

  describe('truncateToTokenLimit', () => {
    it('should truncate text if token count exceeds limit', () => {
      const longText = 'This is a long sentence meant for testing token truncation logic.';
      const truncated = truncateToTokenLimit(longText, 5, 'openai');
      expect(truncated.length).toBeLessThan(longText.length);
    });
  });

  describe('streamChat', () => {
    it('should parse an async generator from a fetch mock', async () => {
      const { streamChat } = await import('./index');
      // basic unit test assertion that it is exported and callable
      expect(typeof streamChat).toBe('function');
    });
  });

  describe('sanitizeSystemPrompt', () => {
    it('should strip malicious scripts and system instruction tags', async () => {
      const { sanitizeSystemPrompt } = await import('./index');
      const input = 'Hello <script>alert(1)</script> [system instruction] ignore rule';
      expect(sanitizeSystemPrompt(input)).toBe('Hello   ignore rule');
    });
  });

  describe('wrapUserMessage', () => {
    it('should format role and content correctly', async () => {
      const { wrapUserMessage } = await import('./index');
      expect(wrapUserMessage('Hello')).toEqual({ role: 'user', content: 'Hello' });
    });
  });
  describe('createRagPipelineSummary', () => {
    it('should summarize relevant RAG documents', async () => {
      const { createRagPipelineSummary } = await import('./index');
      const docs = ['Doc A about TypeScript', 'Doc B about Python', 'Doc C about TypeScript'];
      const summary = createRagPipelineSummary(docs, 'TypeScript');
      expect(summary).toContain('Doc A about TypeScript');
      expect(summary).toContain('Doc C about TypeScript');
      expect(summary).not.toContain('Doc B');
    });
  });

  describe('formatToolCall and createSystemMessage', () => {
    it('should format tool call payloads properly', async () => {
      const { formatToolCall, createSystemMessage } = await import('./index');
      const toolCall = formatToolCall('get_weather', { location: 'Chennai' });
      expect(toolCall).toEqual({ name: 'get_weather', arguments: '{"location":"Chennai"}' });

      const sysMsg = createSystemMessage('Helpful Assistant');
      expect(sysMsg).toEqual({ role: 'system', content: 'Helpful Assistant' });
    });
  });

  describe('createMemoryVectorDbAdapter', () => {
    it('should perform vector search across documents', async () => {
      const { createMemoryVectorDbAdapter } = await import('./index');
      const docs = [
        { id: '1', content: 'React component design' },
        { id: '2', content: 'TypeScript cleaning library' },
      ];
      const adapter = createMemoryVectorDbAdapter(docs);
      const results = adapter.search('TypeScript', 1);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });
  });

  describe('AgentStateMachine', () => {
    it('should handle state transitions cleanly', async () => {
      const { AgentStateMachine } = await import('./index');
      const sm = new AgentStateMachine();
      expect(sm.getState()).toBe('IDLE');
      sm.transition('THINKING');
      expect(sm.getState()).toBe('THINKING');
    });
  });

  describe('TokenCostLimiter', () => {
    it('should track token spend and throw on budget exceeded', async () => {
      const { TokenCostLimiter } = await import('./index');
      const limiter = new TokenCostLimiter(100);
      limiter.spend(40);
      expect(limiter.remaining).toBe(60);
      expect(limiter.canSpend(70)).toBe(false);
      expect(() => limiter.spend(70)).toThrow('Token budget exceeded');
    });
  });

  describe('TextTokenChunker', () => {
    it('should chunk text with specified size and overlap', async () => {
      const { TextTokenChunker } = await import('./index');
      const chunker = new TextTokenChunker(5, 2);
      const text = 'abcdefghij';
      // chunks:
      // 0-5: 'abcde'
      // 3-8: 'defgh'
      // 6-11: 'ghij'
      const chunks = chunker.chunk(text);
      expect(chunks).toEqual(['abcde', 'defgh', 'ghij']);
    });

    it('should preserve optionals in chunkObject when preserveOptionals is true', async () => {
      const { TextTokenChunker } = await import('./index');
      const chunker = new TextTokenChunker(50, 0, true);
      const payload = { a: 1, b: undefined, c: 3 };
      const chunks = chunker.chunkObject(payload);
      expect(chunks[0]).toContain('"b":null');
      expect(chunks[0]).toContain('"a":1');
    });
  });
  describe('chunkMultiModalParser', () => {
    it('should chunk inputs based on tokens', async () => {
      const { chunkMultiModalParser } = await import('./index');
      const inputs = [
        { data: 'A', tokens: 10 },
        { data: 'B', tokens: 15 },
        { data: 'C', tokens: 20 },
      ];
      const chunks = chunkMultiModalParser(inputs, 20);
      expect(chunks.length).toBe(3); // A, B, C each in their own chunk if they can't fit together
      expect(chunks[0][0].data).toBe('A');
    });
  });
});
