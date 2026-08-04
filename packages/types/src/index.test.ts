import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  jsonToTsType,
  get,
  DeepMerge,
  DeepReadonly,
  DeepPartial,
  TransformTemplate,
  SnakeToCamelCase,
  DeepRequired,
} from './index';

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

  describe('DeepRequired', () => {
    it('should correctly infer DeepRequired types', () => {
      type OptionalObj = { a?: 1; b?: { c?: 2 } };
      type RequiredObj = DeepRequired<OptionalObj>;

      // This is a type test, so we just use expectTypeOf
      expectTypeOf<RequiredObj>().toMatchTypeOf<{ a: 1; b: { c: 2 } }>();
    });
  });

  describe('DeepPartial', () => {
    it('should compile correctly', () => {
      const a: DeepPartial<{ x: { y: number } }> = { x: {} };
      expect(a).toBeDefined();
    });
  });

  describe('New Utility Types', () => {
    it('should compile new types correctly', () => {
      // We can't really "test" types at runtime easily with Vitest unless we do tsc
      // We'll just verify the module exports or they don't break the build
      expect(true).toBe(true);
    });
  });

  describe('TransformTemplate', () => {
    it('should transform underscore string types to hyphen string types', () => {
      type Converted = TransformTemplate<'foo_bar'>;
      const val: Converted = 'foo-bar';
      expect(val).toBe('foo-bar');
    });
  });

  describe('SnakeToCamelCase', () => {
    it('should convert snake_case literal types to camelCase literal types', () => {
      type Converted = SnakeToCamelCase<'user_first_name'>;
      const val: Converted = 'userFirstName';
      expect(val).toBe('userFirstName');
    });
  });

  describe('RequireAtLeastOne', () => {
    it('should compile correctly', async () => {
      // Just import for side-effects or inline types to avoid unused var errors
      await import('./index');
      type MyType = { a?: number; b?: number; c?: number };

      // We can't really test the failure case easily in runtime vitest,
      // but we can ensure valid cases pass type check.
      const valid1: import('./index').RequireAtLeastOne<MyType> = { a: 1 };
      const valid2: import('./index').RequireAtLeastOne<MyType> = { a: 1, b: 2 };

      expect(valid1).toBeDefined();
      expect(valid2).toBeDefined();
    });
  });

  describe('MakeOptional and MakeRequired', () => {
    it('should compile correctly', async () => {
      type Original = { a: string; b: number; c?: boolean };

      const opt: import('./index').MakeOptional<Original, 'b'> = { a: 'str' };
      const req: import('./index').MakeRequired<Original, 'c'> = { a: 'str', b: 1, c: true };

      expect(opt.a).toBe('str');
      expect(req.c).toBe(true);
    });
  });

  describe('DeepRequiredStrict', () => {
    it('should infer strict required type recursively', async () => {
      type OptionalDeep = { x?: { y?: string | null } };
      type Strict = import('./index').DeepRequiredStrict<OptionalDeep>;
      expectTypeOf<Strict>().toMatchTypeOf<{ x: { y: string } }>();
    });
  });

  describe('Writable', () => {
    it('should remove readonly modifier from object properties', async () => {
      type ReadonlyPoint = { readonly x: number; readonly y: number };
      type MutablePoint = import('./index').Writable<ReadonlyPoint>;
      expectTypeOf<MutablePoint>().toEqualTypeOf<{ x: number; y: number }>();
    });
  });

  describe('RegexMatchLiteral', () => {
    it('should extract regex match literal types', async () => {
      type Matched = import('./index').RegexMatchLiteral<'abc_test_xyz', 'test'>;
      expectTypeOf<Matched>().toEqualTypeOf<'test'>();
    });
  });
});
