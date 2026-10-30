import { describe, it, expect } from 'vitest';
import { StreamDeduplicator } from './StreamDeduplicator';

describe('StreamDeduplicator', () => {
  it('should dedupe primitive items', () => {
    const s = new StreamDeduplicator();
    expect(s.dedupe([1, 1, 2, 3, 2])).toEqual([1, 2, 3]);
  });

  it('should dedupe objects by structural comparison', () => {
    const s = new StreamDeduplicator();
    const items = [{ id: 1 }, { id: 1 }, { id: 2 }];
    expect(s.dedupe(items)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should dedupe using custom keyFn', () => {
    const s = new StreamDeduplicator<{ id: number; name: string }>({
      keyFn: (item) => item.id,
    });
    const items = [
      { id: 1, name: 'first' },
      { id: 1, name: 'second' },
      { id: 2, name: 'third' },
    ];
    expect(s.dedupe(items)).toEqual([
      { id: 1, name: 'first' },
      { id: 2, name: 'third' },
    ]);
  });

  it('should evaluate isDuplicate streamingly', () => {
    const s = new StreamDeduplicator();
    expect(s.isDuplicate('a')).toBe(false);
    expect(s.isDuplicate('a')).toBe(true);
    expect(s.isDuplicate('b')).toBe(false);
  });
});
