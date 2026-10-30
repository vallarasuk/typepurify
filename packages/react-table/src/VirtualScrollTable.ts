export interface VirtualScrollConfig {
  rowHeight: number;
  viewportHeight: number;
  overscan?: number;
}

export interface VirtualScrollWindow<T> {
  startIndex: number;
  endIndex: number;
  visibleItems: T[];
  totalHeight: number;
  offsetY: number;
}

/**
 * High-performance virtual scroll table windowing engine.
 */
export class VirtualScrollTable<T = any> {
  private config: VirtualScrollConfig;

  constructor(config: VirtualScrollConfig) {
    this.config = {
      rowHeight: config.rowHeight,
      viewportHeight: config.viewportHeight,
      overscan: config.overscan ?? 2,
    };
  }

  computeWindow(items: T[], scrollTop: number): VirtualScrollWindow<T> {
    const totalHeight = items.length * this.config.rowHeight;
    const rawStartIndex = Math.floor(Math.max(0, scrollTop) / this.config.rowHeight);
    const visibleCount = Math.ceil(this.config.viewportHeight / this.config.rowHeight);

    const startIndex = Math.max(0, rawStartIndex - this.config.overscan!);
    const endIndex = Math.min(items.length, rawStartIndex + visibleCount + this.config.overscan!);

    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * this.config.rowHeight;

    return {
      startIndex,
      endIndex,
      visibleItems,
      totalHeight,
      offsetY,
    };
  }

  render(): string {
    return 'virtual-scroll-table';
  }
}
