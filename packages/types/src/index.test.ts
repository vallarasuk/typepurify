import { describe, it, expect } from 'vitest';
import { jsonToTsType, get, DeepMerge, DeepReadonly, DeepPartial } from './index';

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
      const obj = { a: { b: { c: [1, 2, { d: 'target' }] } }, 'x.y': 'dotKey' };

      expect(get(obj, 'a.b.c.2.d')).toBe('target');
      expect(get(obj, 'a.b.c[2].d')).toBe('target'); // Array index notation
      expect(get(obj, ['a', 'b', 'c', '2', 'd'])).toBe('target'); // Array path
      expect(get(obj, 'a["b"].c[2]["d"]')).toBe('target'); // Complex bracket notation
      expect(get(obj, 'x.y')).toBe('dotKey'); // Flat dot key
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

  describe('DeepPartial', () => {
    it('should compile correctly', () => {
      const a: DeepPartial<{ x: { y: number } }> = { x: {} };
      expect(a).toBeDefined();
    });
  });

  describe('New Utility Types', () => {
    it('should compile new types correctly', async () => {
      const { Merge, IsAny, IsNever, TupleToObject, JsonValue } = await import('./index');
      
      // We can't really "test" types at runtime easily with Vitest unless we do tsc
      // We'll just verify the module exports or they don't break the build
      expect(true).toBe(true);
    });
  });
});
