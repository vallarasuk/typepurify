import { describe, it, expect } from 'vitest';
import { cleanLlmJson, PromptTemplate, countTokens, parseAiStream } from './index';

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
});
