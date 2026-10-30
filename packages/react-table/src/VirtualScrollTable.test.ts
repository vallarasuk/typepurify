import { describe, it, expect } from 'vitest';
import { VirtualScrollTable } from './VirtualScrollTable';

describe('VirtualScrollTable', () => {
  it('should compute virtual scroll window slice and heights', () => {
    const table = new VirtualScrollTable({ rowHeight: 20, viewportHeight: 100, overscan: 1 });
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i, label: `Row ${i}` }));

    const windowState = table.computeWindow(items, 100);
    // scrollTop 100 / 20 = row 5. Overscan 1 -> startIndex = 4.
    // Viewport 100 / 20 = 5 rows. End = 5 + 5 + 1 = 11.
    expect(windowState.startIndex).toBe(4);
    expect(windowState.endIndex).toBe(11);
    expect(windowState.visibleItems.length).toBe(7);
    expect(windowState.totalHeight).toBe(1000);
    expect(windowState.offsetY).toBe(80);
    expect(table.render()).toBe('virtual-scroll-table');
  });
});
