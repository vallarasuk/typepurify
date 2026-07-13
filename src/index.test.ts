import { describe, it, expect, expectTypeOf } from 'vitest';
import { clean, cleanInPlace, cleanAsync, cleanInPlaceAsync } from './index';

describe('typepurify core engine', () => {
  it('should deeply remove null and undefined values from messy data maps', () => {
    const apiPayload = {
      id: 101,
      profile: {
        title: null,
        geo: 'IN',
      },
      tags: ['React', null, 'TypeScript'],
    };

    const pristineResult = clean(apiPayload);

    expect(pristineResult).toEqual({
      id: 101,
      profile: {
        geo: 'IN',
      },
      tags: ['React', 'TypeScript'],
    });
  });

  it('should use single-pass array logic correctly', () => {
    const arr = [1, null, 2, undefined, 3];
    expect(clean(arr)).toEqual([1, 2, 3]);
  });

  it('should trim strings if trimStrings is true', () => {
    const payload = {
      name: '  Vallarasu  ',
      empty: '   ',
    };

    expect(clean(payload, { trimStrings: true, stripEmptyStrings: true })).toEqual({
      name: 'Vallarasu',
    });
  });

  it('should strip custom values via stripWhen', () => {
    const payload = {
      id: -1,
      status: 'N/A',
      valid: true,
      nested: {
        val: 'N/A',
      },
    };

    const result = clean(payload, {
      stripWhen: (val) => val === 'N/A' || val === -1,
    });

    expect(result).toEqual({ valid: true, nested: {} });
  });

  it('should clean in place (mutate original object)', () => {
    const original = {
      a: 1,
      b: null,
      c: [null, 2, undefined],
      d: { e: undefined, f: 'N/A' },
    };

    const result = cleanInPlace(original, { stripWhen: (v) => v === 'N/A' });

    expect(original).toEqual({
      a: 1,
      c: [2],
      d: {},
    });
    // Verify it returned the exact same reference
    expect(result === original).toBe(true);
  });

  it('should safely handle highly nested circular references without stack overflow', () => {
    const circularObj: any = { id: 1 };
    circularObj.self = circularObj; // Direct circular
    circularObj.nested = { parent: circularObj, nullVal: null }; // Nested circular

    const cleaned = clean(circularObj);

    // It should strip the nullVal but preserve the object structure
    expect(cleaned.id).toBe(1);
    expect(cleaned.nested).toEqual({ parent: circularObj });
    // Since it returns the same reference for already seen objects:
    expect(cleaned.self).toBe(circularObj);
  });

  it('should safely handle Objects with no prototype (Object.create(null))', () => {
    const protoLess = Object.create(null);
    protoLess.valid = true;
    protoLess.invalid = undefined;

    const cleaned = clean(protoLess);

    expect(cleaned.valid).toBe(true);
    expect(cleaned).not.toHaveProperty('invalid');
  });
  it('should deeply clean Map objects', () => {
    const map = new Map<any, any>();
    map.set('a', 1);
    map.set('b', null);
    map.set(null, 'c');
    map.set(
      'd',
      new Map([
        ['nested', undefined],
        ['valid', true],
      ]),
    );

    const cleaned = clean(map, { stripEmptyObjects: true });

    expect(cleaned.get('a')).toBe(1);
    expect(cleaned.has('b')).toBe(false);
    expect(cleaned.has(null)).toBe(false);
    expect(cleaned.get('d') instanceof Map).toBe(true);
    expect(cleaned.get('d').has('nested')).toBe(false);
    expect(cleaned.get('d').get('valid')).toBe(true);
  });

  it('should deeply clean Set objects', () => {
    const set = new Set<any>();
    set.add(1);
    set.add(null);
    set.add(undefined);
    set.add(2);

    const cleaned = clean(set);

    expect(cleaned.has(1)).toBe(true);
    expect(cleaned.has(2)).toBe(true);
    expect(cleaned.has(null)).toBe(false);
    expect(cleaned.has(undefined)).toBe(false);
  });

  it('should clean in place Map and Set objects', () => {
    const map = new Map<any, any>();
    map.set('a', 1);
    map.set('b', null);

    const set = new Set<any>();
    set.add(1);
    set.add(null);

    cleanInPlace(map);
    cleanInPlace(set);

    expect(map.has('a')).toBe(true);
    expect(map.has('b')).toBe(false);
    expect(set.has(1)).toBe(true);
    expect(set.has(null)).toBe(false);
  });

  it('should apply transform callback to values', () => {
    const payload = {
      dateString: '2024-01-01',
      id: '123',
      removeMe: 'invalid',
    };

    const cleaned = clean(payload, {
      transform: (val, key) => {
        if (key === 'id') return Number(val);
        if (val === 'invalid') return undefined; // Transform to undefined to strip it
        return val;
      },
    });

    expect(cleaned.id).toBe(123);
    expect(cleaned.dateString).toBe('2024-01-01');
    expect(cleaned).not.toHaveProperty('removeMe');
  });

  it('should safely preserve Date, RegExp, and Error objects', () => {
    const d = new Date();
    const r = /test/g;
    const e = new Error('test');
    const fn = () => {};

    expect(clean(d)).toBe(d);
    expect(clean(r)).toBe(r);
    expect(clean(e)).toBe(e);
    expect(clean(fn)).toBe(fn);

    expect(cleanInPlace(d)).toBe(d);
    expect(cleanInPlace(r)).toBe(r);
    expect(cleanInPlace(e)).toBe(e);
    expect(cleanInPlace(fn)).toBe(fn);
  });

  it('should preserve prototypes of custom classes in clean', () => {
    class MyClass {
      valid: boolean = true;
      invalid: any = null;
    }

    const instance = new MyClass();
    const cleaned = clean(instance);

    expect(cleaned instanceof MyClass).toBe(true);
    expect(cleaned.valid).toBe(true);
    expect(cleaned).not.toHaveProperty('invalid');
  });

  describe('Strict Mode Inference', () => {
    it('should remove empty string from unions if stripEmptyStrings is true', () => {
      const payload = {
        name: 'test' as string | '',
        age: 25 as number | null,
      };

      const result = clean(payload, { stripEmptyStrings: true });
      expectTypeOf(result.name).toEqualTypeOf<string>();

      const noStrictResult = clean(payload);
      expectTypeOf(noStrictResult.name).toEqualTypeOf<string | ''>();
    });
  });

  describe('Asynchronous Cleaning', () => {
    it('cleanAsync should deeply remove null and undefined values asynchronously', async () => {
      const apiPayload = {
        id: 101,
        profile: {
          title: null,
          geo: 'IN',
        },
        tags: ['React', null, 'TypeScript'],
      };

      const pristineResult = await cleanAsync(apiPayload);

      expect(pristineResult).toEqual({
        id: 101,
        profile: {
          geo: 'IN',
        },
        tags: ['React', 'TypeScript'],
      });
    });

    it('cleanInPlaceAsync should mutate and clean the original object asynchronously', async () => {
      const original = {
        a: 1,
        b: null,
        c: [null, 2, undefined],
        d: { e: undefined, f: 'N/A' },
      };

      const result = await cleanInPlaceAsync(original, { stripWhen: (v) => v === 'N/A' });

      expect(original).toEqual({
        a: 1,
        c: [2],
        d: {},
      });
      expect(result === original).toBe(true);
    });

    it('should not block the event loop for massive arrays', async () => {
      const largeArray = new Array(5000).fill(null).map((_, i) => (i % 2 === 0 ? i : null));
      let timeoutFired = false;

      setTimeout(() => {
        timeoutFired = true;
      }, 0);

      const cleaned = await cleanAsync(largeArray);

      // Because cleanAsync yields every 1000 items, the timeout should have fired.
      // (This test might be slightly flaky depending on the JS engine tick, but typically it works)
      expect(timeoutFired).toBe(true);
      expect(cleaned.length).toBe(2500);
    });
  });
});
