import { describe, it, expect } from 'vitest';
import { StreamDeduplicator } from './StreamDeduplicator';
describe('StreamDeduplicator', () => {
  it('should dedupe items', () => {
    const d = new StreamDeduplicator();
    expect(d.dedupe([1, 1, 2])).toEqual([1, 2]);
  });
});
