import { describe, it, expect } from 'vitest';
import { VirtualizedListRenderer } from './virtualizedListRenderer';

describe('VirtualizedListRenderer', () => {
  it('should calculate correct ranges', () => {
    const renderer = new VirtualizedListRenderer({
      totalItems: 100,
      itemHeight: 50,
      containerHeight: 500,
      overscan: 2,
    });

    // Scrolled to top
    const range = renderer.getRenderRange(0);
    expect(range.startIndex).toBe(0);
    expect(range.endIndex).toBe(12); // 10 visible + 2 overscan
    expect(renderer.getTotalHeight()).toBe(5000);
  });
});
