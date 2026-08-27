import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  clean,
  cleanInPlace,
  cleanAsync,
  cleanInPlaceAsync,
  advancedJsonParser,
  safeDeepClone,
} from './index';

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
      stripWhen: (val: any) => val === 'N/A' || val === -1,
    });

    expect(result).toEqual({ valid: true, nested: {} });
  });

  it('should strip falsy values if stripFalsy is true', () => {
    const payload = {
      valid: true,
      invalid: false,
      count: 0,
      text: '',
      name: 'test',
    };

    expect(clean(payload, { stripFalsy: true })).toEqual({
      valid: true,
      name: 'test',
    });
  });

  it('should strip NaN values if stripNaN is true', () => {
    const payload = {
      validNumber: 42,
      invalidNumber: NaN,
      text: 'hello',
    };

    expect(clean(payload, { stripNaN: true })).toEqual({
      validNumber: 42,
      text: 'hello',
    });
  });

  it('should strip Infinity values if stripInfinity is true', () => {
    const payload = {
      validNumber: 42,
      posInf: Infinity,
      negInf: -Infinity,
      text: 'hello',
    };

    expect(clean(payload, { stripInfinity: true })).toEqual({
      validNumber: 42,
      text: 'hello',
    });
  });

  it('should clean in place (mutate original object)', () => {
    const original = {
      a: 1,
      b: null,
      c: [null, 2, undefined],
      d: { e: undefined, f: 'N/A' },
    };

    const result = cleanInPlace(original, { stripWhen: (v: any) => v === 'N/A' });

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
    expect(cleaned.nested).toEqual({ parent: cleaned });
    // Since it maps already seen objects to their clones:
    expect(cleaned.self).toBe(cleaned);
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
      transform: (val: any, key: any) => {
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

    expect(clean(d)).not.toBe(d);
    expect(clean(d)).toEqual(d);
    expect(clean(r)).not.toBe(r);
    expect(clean(r)).toEqual(r);
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

      const result = await cleanInPlaceAsync(original, { stripWhen: (v: any) => v === 'N/A' });

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

  describe('Edge Cases and Advanced Configurations', () => {
    it('should deeply remove empty arrays and objects when requested', () => {
      const payload = {
        a: [],
        b: {},
        c: { nested: null },
        d: [null],
        e: { deeply: { nested: {} } },
        f: [[[null]]],
      };

      expect(clean(payload, { stripEmptyArrays: true, stripEmptyObjects: true })).toBeUndefined();
    });

    it('should handle Set and Map properly with empty stripping', () => {
      const payload = {
        set1: new Set(),
        set2: new Set([null]),
        map1: new Map(),
        map2: new Map([['a', null]]),
      };

      expect(
        clean(payload, {
          stripEmptyArrays: true,
          stripEmptyObjects: true,
          stripEmptySets: true,
          stripEmptyMaps: true,
        }),
      ).toBeUndefined();
    });

    it('should run stripWhen and trimStrings even if transform is applied', () => {
      const payload = {
        name: ' VALLARASU ',
        age: 25,
        removeMe: 'strip',
      };

      const result = clean(payload, {
        trimStrings: true,
        stripEmptyStrings: true,
        stripWhen: (v: any) => v === 'STRIP', // it should see uppercase
        transform: (v: any) => (typeof v === 'string' ? v.toUpperCase() : v),
      });

      expect(result).toEqual({ name: 'VALLARASU', age: 25 });
    });
  });

  describe('stripAllEmpty', () => {
    it('should deeply remove empty strings, arrays, objects, sets, and maps when stripAllEmpty is true', () => {
      const payload = {
        a: '',
        b: [],
        c: {},
        d: new Set(),
        e: new Map(),
        f: { valid: true, emptyStr: '' },
      };
      expect(clean(payload, { stripAllEmpty: true })).toEqual({ f: { valid: true } });
      const payloadInPlace = {
        a: '',
        b: [],
        c: {},
        d: new Set(),
        e: new Map(),
        f: { valid: true, emptyStr: '' },
      };
      cleanInPlace(payloadInPlace, { stripAllEmpty: true });
      expect(payloadInPlace).toEqual({ f: { valid: true } });
    });

    it('should work asynchronously', async () => {
      const payloadAsync = {
        a: '',
        b: [],
        c: {},
        d: new Set(),
        e: new Map(),
        f: { valid: true, emptyStr: '' },
      };
      expect(await cleanAsync(payloadAsync, { stripAllEmpty: true })).toEqual({
        f: { valid: true },
      });
      const payloadInPlaceAsync = {
        a: '',
        b: [],
        c: {},
        d: new Set(),
        e: new Map(),
        f: { valid: true, emptyStr: '' },
      };
      await cleanInPlaceAsync(payloadInPlaceAsync, { stripAllEmpty: true });
      expect(payloadInPlaceAsync).toEqual({ f: { valid: true } });
    });
  });

  describe('advancedJsonParser', () => {
    it('should parse valid JSON strings correctly', () => {
      const json = JSON.stringify({ key: 'value', num: 42 });
      expect(advancedJsonParser(json)).toEqual({ key: 'value', num: 42 });
    });

    it('should throw Error with detailed message on invalid JSON', () => {
      expect(() => advancedJsonParser('invalid json')).toThrow('Advanced parsing failed:');
    });
  });

  describe('safeDeepClone', () => {
    it('should deeply clone objects, arrays, Dates, Map, and Set without reference sharing', () => {
      const original = {
        date: new Date('2026-01-01'),
        regex: /test/gi,
        map: new Map([['a', { x: 1 }]]),
        set: new Set([1, 2, 3]),
        list: [{ b: 2 }],
      };

      const cloned = safeDeepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.date).not.toBe(original.date);
      expect(cloned.map).not.toBe(original.map);
      expect(cloned.set).not.toBe(original.set);
      expect(cloned.list[0]).not.toBe(original.list[0]);
    });

    it('should handle circular references safely', () => {
      const circ: any = { a: 1 };
      circ.self = circ;

      const cloned = safeDeepClone(circ);
      expect(cloned.a).toBe(1);
      expect(cloned.self).toBe(cloned);
    });
  });

  describe('isPlainObject', () => {
    it('should correctly identify plain objects', async () => {
      const { isPlainObject } = await import('./index');
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);

      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(new Map())).toBe(false);
    });
  });

  describe('deepMerge', () => {
    it('should deeply merge two objects', async () => {
      const { deepMerge } = await import('./index');
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };

      const merged = deepMerge(obj1, obj2);
      expect(merged).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });

      // Should merge and deduplicate arrays (based on implementation)
      const obj3 = { arr: [1, 2] };
      const obj4 = { arr: [3] };
      expect(deepMerge(obj3, obj4)).toEqual({ arr: [1, 2, 3] });
    });
  });

  describe('cloneDeep', () => {
    it('should deeply clone objects and arrays', async () => {
      const { cloneDeep } = await import('./index');
      const obj = { a: 1, b: [2, { c: 3 }] };
      const clone = cloneDeep(obj);
      expect(clone).toEqual(obj);
      expect(clone).not.toBe(obj);
      expect(clone.b).not.toBe(obj.b);
      expect((clone.b[1] as any).c).toBe(3);
    });
  });

  describe('v1.6.2 memory and transform edge cases', () => {
    it('should correctly process custom transform callbacks with null key', () => {
      const result = clean(
        { secret: 'hidden' },
        {
          transform: (val: any, key: any) => {
            if (key === 'secret') return undefined;
            return val;
          },
        },
      );
      expect(result).toEqual({});
    });

    it('should handle ArrayBuffer and TypedArray memory views safely', () => {
      const buffer = new ArrayBuffer(8);
      const view = new Int32Array(buffer);
      view[0] = 42;

      const obj = { buffer, view, regular: null };
      const cleaned = clean(obj);

      expect(cleaned.buffer).toBe(buffer);
      expect(cleaned.view).toBe(view);
      expect(cleaned.view[0]).toBe(42);
      expect(cleaned).not.toHaveProperty('regular');
    });
  });

  describe('MemoryBuffer', () => {
    it('should buffer items and respect capacity limits', async () => {
      const { MemoryBuffer, preventMemoryLeaks } = await import('./index');
      const buf = new MemoryBuffer<number>(2);

      expect(buf.push(10)).toBe(true);
      expect(buf.push(20)).toBe(true);
      expect(buf.push(30)).toBe(false); // Capacity exceeded
      expect(buf.size()).toBe(2);

      expect(buf.flush()).toEqual([10, 20]);
      expect(buf.size()).toBe(0);

      buf.push(1);
      buf.push(2);
      buf.pruneExcess();
      expect(buf.size()).toBe(2);

      preventMemoryLeaks(new WeakMap());
    });

    it('should traverse object graph nodes without circular loop crashes', async () => {
      const { traverseObjectGraph } = await import('./index');
      const visited: string[] = [];
      const node: any = { a: 1, b: { c: 2 } };
      node.self = node; // circular

      traverseObjectGraph(node, (_, path) => {
        if (path.length > 0) visited.push(path.join('.'));
      });

      expect(visited).toContain('a');
      expect(visited).toContain('b');
      expect(visited).toContain('b.c');
    });

    it('should recursively sanitize all string values in object graph', async () => {
      const { sanitizeObject } = await import('./index');
      const input = {
        name: '  alice ',
        meta: { title: '  DEVELOPER  ' },
        tags: ['  react  ', ' typescript '],
      };

      const result = sanitizeObject(input, (s) => s.trim().toLowerCase());
      expect(result).toEqual({
        name: 'alice',
        meta: { title: 'developer' },
        tags: ['react', 'typescript'],
      });
    });

    it('should crawl array items using crawlArray', async () => {
      const { crawlArray } = await import('./index');
      const res = crawlArray([1, null, 3], (val) => (val ? val * 2 : undefined));
      expect(res).toEqual([2, 6]);

      const limited = crawlArray([1, 2, 3, 4, 5], (val) => val * 10, { limit: 3 });
      expect(limited).toEqual([10, 20, 30]);

      const flattened = crawlArray([1, 2], (val) => [val, val * 2], { flatten: true });
      expect(flattened).toEqual([1, 2, 2, 4]);

      const cleaned = crawlArray([{ a: 1, b: null }], (item) => item, { cleanResult: true });
      expect(cleaned).toEqual([{ a: 1 }]);
    });

    it('should infer schema of object structure using inferSchema', async () => {
      const { inferSchema, inferSchemaBatch } = await import('./index');
      const schema = inferSchema({ name: 'Alice', age: 30 });
      expect(schema.type).toBe('object');

      const batch = inferSchemaBatch([{ a: 1 }, { b: 'str' }]);
      expect(batch).toHaveLength(2);
      expect(batch[0].type).toBe('object');
    });

    it('should invoke wasm export using createWasmBindingsAdapter', async () => {
      const { createWasmBindingsAdapter } = await import('./index');
      const adapter = createWasmBindingsAdapter({ add: (a: number, b: number) => a + b });
      expect(adapter.isReady()).toBe(true);
      expect(adapter.callWasm('add', 2, 3)).toBe(5);
    });

    it('should optimize object graph traversal using cleanV2', async () => {
      const { cleanV2 } = await import('./index');
      const data = { a: 1, b: { c: 2 }, d: [3, 4] };
      const cleaned = cleanV2(data);
      expect(cleaned).toEqual(data);
      expect(cleaned).not.toBe(data); // Ensures it's a deep copy, not reference

      // Verify circular ref resilience or deduplication
      const circular: any = { a: 1 };
      circular.self = circular;
      const cleanedCircular = cleanV2(circular);
      expect(cleanedCircular.a).toBe(1);
      expect(cleanedCircular.self).toBe(cleanedCircular);
    });
  });
  describe('cleanV2 try-finally test', () => {
    it('should work', async () => {
      const { cleanV2 } = await import('./index');
      const obj = { a: 1 };
      const cleaned = cleanV2(obj);
      expect(cleaned).toEqual({ a: 1 });
    });
  });
  describe('traverseObjectGraphV2', () => {
    it('should iteratively traverse objects without stack overflow', async () => {
      const { traverseObjectGraphV2 } = await import('./index');
      const obj = { a: 1, b: { c: 2, d: [3] } };
      const paths: string[][] = [];
      const values: any[] = [];
      traverseObjectGraphV2(obj, (val, path) => {
        paths.push(path);
        values.push(val);
      });
      // Top level object is visited first
      expect(paths[0]).toEqual([]);
      expect(values[0]).toBe(obj);
      // Ensure primitives and nested objects are visited
      expect(values).toContain(1);
      expect(values).toContain(2);
      expect(values).toContain(3);
    });
  });
  describe('optimizeArrayCrawler', () => {
    it('should process array items in batches correctly', async () => {
      const { optimizeArrayCrawler } = await import('./index');
      let count = 0;
      const items = Array.from({ length: 250 }, (_, i) => i);
      await optimizeArrayCrawler(
        items,
        async () => {
          count++;
        },
        100,
      );
      expect(count).toBe(250);
    });
  });
});
