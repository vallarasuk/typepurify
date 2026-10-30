import { describe, it, expect } from 'vitest';
import { SlidingWindowDeduplicator } from './SlidingWindowDeduplicator';

describe('SlidingWindowDeduplicator', () => {
  it('should detect duplicate events within sliding window', () => {
    const dedupe = new SlidingWindowDeduplicator({ windowMs: 1000 });
    const now = 10000;

    expect(dedupe.isDuplicate({ event: 'click', user: 1 }, now)).toBe(false);
    expect(dedupe.isDuplicate({ event: 'click', user: 1 }, now + 500)).toBe(true);
    // After window expires
    expect(dedupe.isDuplicate({ event: 'click', user: 1 }, now + 1500)).toBe(false);
  });

  it('should filter duplicates from an array', () => {
    const dedupe = new SlidingWindowDeduplicator<string>({ windowMs: 1000 });
    const items = ['msg1', 'msg2', 'msg1', 'msg3'];
    const filtered = dedupe.filterDuplicates(items);
    expect(filtered).toEqual(['msg1', 'msg2', 'msg3']);
  });
});
