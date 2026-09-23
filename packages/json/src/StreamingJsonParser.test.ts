import { describe, it, expect } from 'vitest';
import { StreamingJsonParser } from './StreamingJsonParser';
describe('StreamingJsonParser', () => {
  it('should parse', () => {
    const p = new StreamingJsonParser();
    expect(p.parse('{}')).toEqual({});
  });
});
