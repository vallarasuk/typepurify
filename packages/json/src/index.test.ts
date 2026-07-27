import { describe, it, expect } from 'vitest';
import { deepDiff, repairJson, removeCircular, compareIgnoreKeys, flattenCsvToJson } from './index';

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
      expect(safeParse('invalid', { fallback: true })).toEqual({ fallback: true });
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
});
