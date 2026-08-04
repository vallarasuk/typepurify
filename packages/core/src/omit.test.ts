import { describe, it, expect } from 'vitest';
import { deepOmit } from './omit';

describe('deepOmit', () => {
  it('should omit top-level keys', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = deepOmit(obj, ['b']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('should omit nested keys', () => {
    const obj = { a: 1, nested: { b: 2, c: 3, deep: { b: 4 } } };
    const result = deepOmit(obj, ['b']);
    expect(result).toEqual({ a: 1, nested: { c: 3, deep: {} } });
  });

  it('should omit keys from objects inside arrays', () => {
    const obj = {
      list: [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ],
    };
    const result = deepOmit(obj, ['b']);
    expect(result).toEqual({ list: [{ a: 1 }, { a: 3 }] });
  });

  it('should handle null and undefined safely', () => {
    expect(deepOmit(null, ['a'])).toBeNull();
    expect(deepOmit(undefined, ['a'])).toBeUndefined();
  });

  it('should not mutate special objects like Date or RegExp', () => {
    const date = new Date();
    const regex = /test/g;
    const obj = { date, regex, a: 1 };
    const result = deepOmit(obj, ['a']);

    expect(result.date).toBe(date);
    expect(result.regex).toBe(regex);
    expect((result as any).a).toBeUndefined();
  });
});
