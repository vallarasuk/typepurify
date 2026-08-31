export interface VirtualizedListOptions {
  totalItems: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface RenderRange {
  startIndex: number;
  endIndex: number;
  offsetY: number;
}

/**
 * Core logic for rendering massive lists efficiently in @typepurify/paginate.
 * Independent of any specific UI framework.
 */
export class VirtualizedListRenderer {
  private totalItems: number;
  private itemHeight: number;
  private containerHeight: number;
  private overscan: number;

  constructor(options: VirtualizedListOptions) {
    this.totalItems = options.totalItems;
    this.itemHeight = options.itemHeight;
    this.containerHeight = options.containerHeight;
    this.overscan = options.overscan ?? 3;
  }

  /**
   * Calculates the exact range of items to render based on scroll position.
   * @param scrollTop The current vertical scroll position of the container.
   */
  public getRenderRange(scrollTop: number): RenderRange {
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);

    // Calculate raw start and end indices based on scroll
    let startIndex = Math.floor(scrollTop / this.itemHeight);
    let endIndex = startIndex + visibleCount;

    // Apply overscan to render extra items above and below the visible area
    startIndex = Math.max(0, startIndex - this.overscan);
    endIndex = Math.min(this.totalItems - 1, endIndex + this.overscan);

    // Calculate the Y offset to position the items correctly inside the scroll container
    const offsetY = startIndex * this.itemHeight;

    return {
      startIndex,
      endIndex,
      offsetY,
    };
  }

  /**
   * Returns the total height of the virtualized list.
   * Apply this height to the inner container to create the correct scrollbar.
   */
  public getTotalHeight(): number {
    return this.totalItems * this.itemHeight;
  }

  /**
   * Update configuration dynamically (e.g., if container resizes).
   */
  public updateOptions(options: Partial<VirtualizedListOptions>): void {
    if (options.totalItems !== undefined) this.totalItems = options.totalItems;
    if (options.itemHeight !== undefined) this.itemHeight = options.itemHeight;
    if (options.containerHeight !== undefined) this.containerHeight = options.containerHeight;
    if (options.overscan !== undefined) this.overscan = options.overscan;
  }
}
