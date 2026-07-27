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
      expect(estimateCost(1000, 'unknown')).toBe(0);
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
});
