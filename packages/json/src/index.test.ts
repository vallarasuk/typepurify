import { describe, it, expect } from 'vitest';
import { deepDiff, repairJson, removeCircular, compareIgnoreKeys } from './index';

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
  });
});
