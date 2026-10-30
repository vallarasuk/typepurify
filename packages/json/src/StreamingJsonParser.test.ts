import { describe, it, expect } from 'vitest';
import { StreamingJsonParser } from './StreamingJsonParser';

describe('StreamingJsonParser', () => {
  it('should parse single JSON line', () => {
    const parser = new StreamingJsonParser();
    expect(parser.parse('{"id": 1}')).toEqual({ id: 1 });
  });

  it('should handle streaming chunks and flush remaining buffer', () => {
    const parser = new StreamingJsonParser();
    const batch1 = parser.feed('{"a": 1}\n{"b":');
    expect(batch1).toEqual([{ a: 1 }]);

    const batch2 = parser.feed(' 2}\n');
    expect(batch2).toEqual([{ b: 2 }]);

    parser.feed('{"c": 3}');
    const flushed = parser.flush();
    expect(flushed).toEqual([{ c: 3 }]);
  });
});
