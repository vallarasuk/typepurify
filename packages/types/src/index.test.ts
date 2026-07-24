import { describe, it, expect } from 'vitest';
import { jsonToTsType, get, DeepMerge, DeepReadonly } from './index';

describe('@typepurify/types', () => {
  describe('jsonToTsType', () => {
    it('should generate types from JSON', () => {
      expect(jsonToTsType(123)).toBe('number');
      expect(jsonToTsType('str')).toBe('string');
      expect(jsonToTsType(true)).toBe('boolean');
      expect(jsonToTsType(null)).toBe('null');
      expect(jsonToTsType([1, 2, 3])).toBe('number[]');
      expect(jsonToTsType({ a: 1, b: 'str' })).toBe('{ a: number; b: string; }');
      expect(jsonToTsType({ user: { id: 1 } })).toBe('{ user: { id: number; }; }');
    });
  });

  describe('get', () => {
    it('should extract values using string paths', () => {
      const obj = { a: { b: { c: [1, 2, { d: 'target' }] } } };

      expect(get(obj, 'a.b.c.2.d')).toBe('target');
      expect(get(obj, 'a.b.c[2].d')).toBe('target'); // Array index notation
      expect(get(obj, ['a', 'b', 'c', '2', 'd'])).toBe('target'); // Array path
    });

    it('should return default value if not found', () => {
      const obj = { a: 1 };
      expect(get(obj, 'a.b.c', 'default')).toBe('default');
      expect(get(null, 'a', 'default')).toBe('default');
    });
  });

  describe('TypeScript Utility Types (compile-time)', () => {
    it('DeepMerge should merge types (type check)', () => {
      type A = { a: string; x: { y: number } };
      type B = { b: number; x: { z: boolean } };
      type Merged = DeepMerge<A, B>;

      // This is a type-only check represented in a value test
      const obj: Merged = {
        a: 'str',
        b: 1,
        x: { y: 2, z: true },
      };
      expect(obj.x.z).toBe(true);
    });

    it('DeepReadonly should enforce readonly (type check)', () => {
      type A = { a: { b: string[] } };
      type RO_A = DeepReadonly<A>;

      const obj: RO_A = { a: { b: ['str'] } };

      expect(obj.a.b[0]).toBe('str');
    });
  });
});
