export interface CursorResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface CursorPaginatorOptions<T> {
  getCursor?: (item: T) => string;
}

/**
 * Standard cursor-based paginator with nextCursor resolution and capacity indicators.
 */
export class CursorPaginator<T = any> {
  private getCursor: (item: T) => string;

  constructor(options: CursorPaginatorOptions<T> = {}) {
    this.getCursor =
      options.getCursor ??
      ((item: any) =>
        item?.id !== undefined
          ? String(item.id)
          : Buffer.from(JSON.stringify(item)).toString('base64'));
  }

  paginate(items: T[], cursor?: string | null, limit: number = 10): CursorResult<T> {
    let startIndex = 0;
    if (cursor) {
      const foundIdx = items.findIndex((item) => this.getCursor(item) === cursor);
      if (foundIdx !== -1) {
        startIndex = foundIdx + 1;
      }
    }

    const sliced = items.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < items.length;
    const nextCursor =
      hasMore && sliced.length > 0 ? this.getCursor(sliced[sliced.length - 1]) : null;

    return {
      data: sliced,
      nextCursor,
      hasMore,
      total: items.length,
    };
  }
}
