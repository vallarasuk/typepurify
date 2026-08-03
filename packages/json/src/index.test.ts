import { describe, it, expect } from 'vitest';
import {
  deepDiff,
  repairJson,
  removeCircular,
  compareIgnoreKeys,
  flattenCsvToJson,
  jsonToXml,
} from './index';

describe('@typepurify/json', () => {
  describe('deepDiff', () => {
    it('should diff primitives', () => {
      expect(deepDiff(1, 2)).toEqual({ old: 1, new: 2 });
      expect(deepDiff('a', 'a')).toBeUndefined();
    });

    it('should diff nested objects', () => {
      const obj1 = { a: 1, b: { c: 2 }, d: 3 };
      const obj2 = { a: 1, b: { c: 3, e: 4 }, d: undefined };

      const diff = deepDiff(obj1, obj2);
      expect(diff.a).toBeUndefined();
      expect(diff.b.c).toEqual({ old: 2, new: 3 });
      expect(diff.b.e).toEqual({ added: 4 });
      expect(diff.d).toEqual({ old: 3, new: undefined });
    });
  });

  describe('repairJson', () => {
    it('should repair unquoted keys and single quotes', () => {
      const invalid = "{ a: 'hello', b: 1, }";
      const repaired = repairJson(invalid);
      expect(repaired).toBe('{ "a": "hello", "b": 1}');
      expect(JSON.parse(repaired)).toEqual({ a: 'hello', b: 1 });
    });
  });

  describe('removeCircular', () => {
    it('should replace circular references with [Circular]', () => {
      const a: any = { id: 1 };
      a.self = a;

      const cleaned = removeCircular(a);
      expect(cleaned.id).toBe(1);
      expect(cleaned.self).toBe('[Circular]');

      // Should now be safely stringifiable
      expect(() => JSON.stringify(cleaned)).not.toThrow();
    });
  });

  describe('compareIgnoreKeys', () => {
    it('should ignore specified keys during comparison', () => {
      const obj1 = { id: 1, name: 'Alice', updatedAt: 'yesterday' };
      const obj2 = { id: 1, name: 'Alice', updatedAt: 'today' };

      expect(compareIgnoreKeys(obj1, obj2)).toBe(false);
      expect(compareIgnoreKeys(obj1, obj2, ['updatedAt'])).toBe(true);
    });

    it('should ignore nested keys', () => {
      const obj1 = { user: { id: 1, meta: { ts: 1 } } };
      const obj2 = { user: { id: 1, meta: { ts: 2 } } };

      expect(compareIgnoreKeys(obj1, obj2, ['user.meta.ts'])).toBe(true);
    });

    it('should support Set for ignored keys', () => {
      const obj1 = { user: { id: 1, meta: { ts: 1 } } };
      const obj2 = { user: { id: 1, meta: { ts: 2 } } };

      expect(compareIgnoreKeys(obj1, obj2, new Set(['user.meta.ts']))).toBe(true);
    });
  });

  describe('removeCircular (sortKeys)', () => {
    it('should sort keys if sortKeys is true', () => {
      const obj = { b: 2, a: 1 };
      const res = removeCircular(obj, { sortKeys: true });
      expect(Object.keys(res)).toEqual(['a', 'b']);
    });
  });

  describe('safeParse', () => {
    it('should parse valid json', async () => {
      const { safeParse } = await import('./index');
      expect(safeParse('{"a":1}', {})).toEqual({ a: 1 });
    });

    it('should return fallback on invalid json', async () => {
      const { safeParse } = await import('./index');
      expect(safeParse('{"a":1}', { b: 2 })).toEqual({ a: 1 });
      expect(safeParse('invalid', { b: 2 })).toEqual({ b: 2 });
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON without throwing', async () => {
      const { safeJsonParse } = await import('./index');
      const { data, error } = safeJsonParse('{"a":1}');
      expect(data).toEqual({ a: 1 });
      expect(error).toBeNull();
    });

    it('should return error object for invalid JSON', async () => {
      const { safeJsonParse } = await import('./index');
      const { data, error } = safeJsonParse('invalid');
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error!.message).toMatch(/Unexpected token/);
    });
  });

  describe('deepMerge', () => {
    it('should deeply merge objects', async () => {
      const { deepMerge } = await import('./index');
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };

      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
      // Mutates target
      expect(target).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });

  describe('jsonSize', () => {
    it('should calculate approximate byte size', async () => {
      const { jsonSize } = await import('./index');
      expect(jsonSize('test')).toBe(6); // "test" is 6 chars including quotes
      expect(jsonSize(123)).toBe(3);
      expect(jsonSize({ a: 1 })).toBe(7); // {"a":1}
    });
  });

  describe('flattenCsvToJson', () => {
    it('should parse CSV lines into array of objects', () => {
      const csv = 'name,age\nAlice,30\nBob,25';
      const result = flattenCsvToJson(csv);
      expect(result).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ]);
    });

    it('should return empty array for empty string', () => {
      expect(flattenCsvToJson('')).toEqual([]);
    });
  });

  describe('jsonToXml', () => {
    it('should convert JSON object structure to XML string', () => {
      const input = { user: { name: 'Alice', age: 30 } };
      const xml = jsonToXml(input, 'data');
      expect(xml).toBe('<data><user><name>Alice</name><age>30</age></user></data>');
    });
  });

  describe('safeJsonStringify', () => {
    it('should stringify standard objects', async () => {
      const { safeJsonStringify } = await import('./index');
      expect(safeJsonStringify({ a: 1 })).toContain('"a": 1');
    });

    it('should handle circular references safely', async () => {
      const { safeJsonStringify } = await import('./index');
      const circ: any = { a: 1 };
      circ.self = circ;

      const str = safeJsonStringify(circ);
      expect(str).toContain('"a": 1');
      expect(str).toContain('"[Circular]"');
    });
  });

  describe('isJsonString', () => {
    it('should return true for valid JSON', async () => {
      const { isJsonString } = await import('./index');
      expect(isJsonString('{"a":1}')).toBe(true);
      expect(isJsonString('123')).toBe(true);
      expect(isJsonString('"test"')).toBe(true);
    });

    it('should return false for invalid JSON', async () => {
      const { isJsonString } = await import('./index');
      expect(isJsonString('invalid')).toBe(false);
      expect(isJsonString('{a:1}')).toBe(false);
      expect(isJsonString(null as any)).toBe(false);
    });
  });

  describe('jsonPathSelector', () => {
    it('should extract nested values using dot notation path string', async () => {
      const { jsonPathSelector } = await import('./index');
      const obj = { user: { profile: { name: 'Alice' } } };

      expect(jsonPathSelector(obj, 'user.profile.name')).toBe('Alice');
      expect(jsonPathSelector(obj, 'user.profile.age', 25)).toBe(25);
    });
  });

  describe('jsonDiff', () => {
    it('should calculate key differences between two objects', async () => {
      const { jsonDiff } = await import('./index');
      const obj1 = { a: 1, b: 'old' };
      const obj2 = { a: 1, b: 'new', c: true };

      const diff = jsonDiff(obj1, obj2);
      expect(diff).toEqual({
        b: { from: 'old', to: 'new' },
        c: { from: undefined, to: true },
      });
    });
  });

  describe('LargeStreamParser', () => {
    it('should parse newline-delimited JSON stream chunks', async () => {
      const { LargeStreamParser } = await import('./index');
      const parser = new LargeStreamParser();

      const items1 = parser.push('{"id":1}\n{"id":2');
      expect(items1).toEqual([{ id: 1 }]);

      const items2 = parser.push('}\n{"id":3}\n');
      expect(items2).toEqual([{ id: 2 }, { id: 3 }]);
    });
  });
});
