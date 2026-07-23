import { describe, it, expect } from 'vitest';
import { cleanParse } from './parse';

describe('cleanParse core engine', () => {
  it('should parse and clean a simple object in a single pass', () => {
    const rawJSON = '{"id": 101, "name": null, "valid": true}';
    const result = cleanParse<any>(rawJSON);
    expect(result).toEqual({ id: 101, valid: true });
  });

  it('should deeply remove null and undefined values from messy data maps', () => {
    const rawJSON = JSON.stringify({
      id: 101,
      profile: {
        title: null,
        geo: 'IN',
      },
      tags: ['React', null, 'TypeScript'],
    });

    const pristineResult = cleanParse(rawJSON);

    expect(pristineResult).toEqual({
      id: 101,
      profile: {
        geo: 'IN',
      },
      tags: ['React', 'TypeScript'],
    });
  });

  it('should use single-pass array logic correctly', () => {
    const rawJSON = '[1, null, 2, null, 3]';
    expect(cleanParse(rawJSON)).toEqual([1, 2, 3]);
  });

  it('should strip empty strings if stripEmptyStrings is true', () => {
    const rawJSON = JSON.stringify({
      name: 'Vallarasu',
      empty: '',
    });

    expect(cleanParse(rawJSON, { stripEmptyStrings: true })).toEqual({
      name: 'Vallarasu',
    });
  });

  it('should strip custom values via stripWhen', () => {
    const rawJSON = JSON.stringify({
      id: -1,
      status: 'N/A',
      valid: true,
      nested: {
        val: 'N/A',
      },
    });

    const result = cleanParse<any>(rawJSON, {
      stripWhen: (val: any) => val === 'N/A' || val === -1,
    });

    expect(result).toEqual({ valid: true, nested: {} });
  });

  it('should apply transform callback to values', () => {
    const rawJSON = JSON.stringify({
      dateString: '2024-01-01',
      id: '123',
      removeMe: 'invalid',
    });

    const cleaned = cleanParse<any>(rawJSON, {
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

  it('should handle complex json structures natively without intermediate JSON.parse', () => {
    const complexJson = `
      {
        "escaped": "newline\\n\\t\\"",
        "negative": -42.5e-1,
        "bool": false,
        "arr": [true, false, null, "test"]
      }
    `;
    const result = cleanParse(complexJson);
    expect(result).toEqual({
      escaped: 'newline\n\t"',
      negative: -4.25,
      bool: false,
      arr: [true, false, 'test'],
    });
  });

  it('should strip empty objects and arrays if options provided', () => {
    const rawJSON = JSON.stringify({
      a: [],
      b: {},
      c: { nested: null }, // nested becomes {}, then stripped
      d: [null], // nested becomes [], then stripped
    });

    const result = cleanParse(rawJSON, {
      stripEmptyArrays: true,
      stripEmptyObjects: true,
    });

    expect(result).toBeUndefined();
  });

  it('should run stripWhen and trimStrings even if transform is applied to a string', () => {
    const rawJSON = JSON.stringify({
      name: ' VALLARASU ',
      age: 25,
      removeMe: 'strip',
    });

    const result = cleanParse(rawJSON, {
      trimStrings: true,
      stripEmptyStrings: true,
      stripWhen: (v: any) => v === 'STRIP', // it should see uppercase
      transform: (v: any) => (typeof v === 'string' ? v.toUpperCase() : v),
    });

    expect(result).toEqual({ name: 'VALLARASU', age: 25 });
  });

  it('should run stripEmptyObjects after an object is transformed to a new object', () => {
    const rawJSON = JSON.stringify({
      data: {
        keepMe: false,
      },
    });

    const result = cleanParse(rawJSON, {
      stripEmptyObjects: true,
      transform: (v: any) => {
        if (typeof v === 'object' && v !== null && 'keepMe' in v) {
          if (!v.keepMe) return {}; // transform to empty object
        }
        return v;
      },
    });

    expect(result).toBeUndefined();
  });
});
