/**
 * Parses a base64 encoded cursor into its original string value.
 * @param cursor The base64 encoded cursor
 * @returns The decoded cursor string, or the original cursor if decoding fails or environment doesn't support it
 */
export function parseCursor(cursor: string): string {
  try {
    if (typeof atob === 'function') {
      return atob(cursor);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(cursor, 'base64').toString('utf-8');
    }
  } catch {
    // Ignore decoding errors and fallback to original
  }
  return cursor;
}

/**
 * Creates a base64 encoded cursor from a string value.
 * @param value The value to encode
 * @returns The base64 encoded cursor
 */
export function createCursor(value: string): string {
  try {
    if (typeof btoa === 'function') {
      return btoa(value);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(value, 'utf-8').toString('base64');
    }
  } catch {
    // Fallback to original
  }
  return value;
}

/**
 * Calculates the offset based on page number and limit.
 * @param page The 1-indexed page number
 * @param limit The number of items per page
 * @returns The calculated offset (0-indexed)
 */
export function parseOffset(page: number, limit: number): number {
  const p = Math.max(1, page);
  const l = Math.max(1, limit);
  return (p - 1) * l;
}

export interface InfiniteScrollState {
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
}

export class InfiniteScrollManager {
  private state: InfiniteScrollState = {
    page: 1,
    hasMore: true,
    isLoading: false,
    error: null,
  };

  private listeners: Set<(state: InfiniteScrollState) => void> = new Set();

  getState(): InfiniteScrollState {
    return { ...this.state };
  }

  subscribe(listener: (state: InfiniteScrollState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  startLoad() {
    if (this.state.isLoading || !this.state.hasMore) return false;
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();
    return true;
  }

  completeLoad(itemsCount: number, limit: number) {
    this.state.isLoading = false;
    this.state.hasMore = itemsCount >= limit && itemsCount > 0;
    if (this.state.hasMore) {
      this.state.page += 1;
    }
    this.notify();
  }

  failLoad(error: Error) {
    this.state.isLoading = false;
    this.state.error = error;
    this.notify();
  }

  reset() {
    this.state = {
      page: 1,
      hasMore: true,
      isLoading: false,
      error: null,
    };
    this.notify();
  }
}

/**
 * Attempts to automatically find a cursor from an API response data object.
 * Checks common fields like `next_cursor`, `nextCursor`, `cursor`, `id`, `createdAt`.
 * @param data The data object or array from the API response
 * @returns The extracted cursor as a string, or undefined if not found
 */
export function extractCursor(data: any): string | undefined {
  if (!data) return undefined;

  if (Array.isArray(data)) {
    if (data.length === 0) return undefined;
    const lastItem = data[data.length - 1];
    return extractCursor(lastItem);
  }

  if (typeof data !== 'object') return undefined;

  const cursorKeys = ['next_cursor', 'nextCursor', 'cursor', 'nextPageToken', 'id', 'createdAt'];
  for (const key of cursorKeys) {
    if (data[key] !== undefined && data[key] !== null) {
      return String(data[key]);
    }
  }

  return undefined;
}

/**
 * Automatically paginates through all pages using an async generator.
 * @param fetchPageFn Function that fetches a single page and returns { items, nextCursor }
 * @param initialCursor Optional initial cursor to start from
 */
export async function* paginateAll<T>(
  fetchPageFn: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string }>,
  initialCursor?: string,
): AsyncGenerator<T[], void, unknown> {
  let currentCursor: string | undefined = initialCursor;
  let hasNext = true;

  while (hasNext) {
    const page = await fetchPageFn(currentCursor);
    if (page.items && page.items.length > 0) {
      yield page.items;
    }

    currentCursor = page.nextCursor;
    hasNext = !!currentCursor;
  }
}

/**
 * Merges paginated pages while removing duplicate items to prevent overlapping list item rendering.
 */
export function mergePaginatedPages<T>(
  existingItems: T[],
  newItems: T[],
  keyExtractor: (item: T) => any = (item: any) => item.id,
): T[] {
  const seenKeys = new Set(existingItems.map(keyExtractor));
  const uniqueNewItems = newItems.filter((item) => {
    const key = keyExtractor(item);
    if (key === undefined || seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
  return [...existingItems, ...uniqueNewItems];
}

export interface RelayEdge<T> {
  node: T;
  cursor: string;
}

export interface RelayPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface RelayConnection<T> {
  edges: RelayEdge<T>[];
  pageInfo: RelayPageInfo;
  totalCount?: number;
}

/**
 * Builds a Relay-compliant connection object from a list of items.
 * @param items The items in the current page
 * @param cursorExtractor A function to extract a cursor from an item (default uses extractCursor)
 * @param hasNextPage Whether there is a next page
 * @param hasPreviousPage Whether there is a previous page
 * @param totalCount Optional total count of items
 */
export function buildConnection<T>(
  items: T[],
  cursorExtractor: (item: T) => string = (item) => extractCursor(item) ?? '',
  hasNextPage: boolean = false,
  hasPreviousPage: boolean = false,
  totalCount?: number,
): RelayConnection<T> {
  const edges = items.map((item) => ({
    node: item,
    cursor: cursorExtractor(item),
  }));

  const startCursor = edges.length > 0 ? edges[0].cursor : undefined;
  const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : undefined;

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor,
      endCursor,
    },
    totalCount,
  };
}

/**
 * Cursor parser to handle edge cache pre-warming for paginated queries.
 */
export function preFetchCursor(
  cursorId: string,
  limit: number,
): Promise<{ cursorId: string; limit: number }> {
  // Simulates pre-fetching the next page of results
  if (!cursorId || limit <= 0) {
    return Promise.resolve({ cursorId: cursorId || '', limit: Math.max(0, limit) });
  }
  return Promise.resolve({ cursorId, limit });
}

/**
 * Creates a paginated page slice from an array of items using a cursor and limit.
 */
export function createCursorPaginator<T>(items: T[], cursorExtractor: (item: T) => string) {
  return function paginateSlice(afterCursor?: string, limit = 10) {
    let startIndex = 0;
    if (afterCursor) {
      const idx = items.findIndex((item) => cursorExtractor(item) === afterCursor);
      if (idx !== -1) {
        startIndex = idx + 1;
      }
    }
    const sliced = items.slice(startIndex, startIndex + limit);
    const hasNextPage = startIndex + limit < items.length;
    const hasPreviousPage = startIndex > 0;
    const nextCursor = sliced.length > 0 ? cursorExtractor(sliced[sliced.length - 1]) : undefined;

    return {
      items: sliced,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        nextCursor,
      },
    };
  };
}

/**
 * Simple helper to calculate total pages given total items and limit per page.
 */
export function calculateTotalPages(totalItems: number, limit: number): number {
  if (totalItems <= 0 || limit <= 0) return 0;
  return Math.ceil(totalItems / limit);
}

/**
 * Helper to determine if there is a previous page.
 */
export function calculateHasPreviousPage(page: number): boolean {
  return page > 1;
}

/**
 * Helper to determine if there is a next page.
 */
export function calculateHasNextPage(page: number, totalPages: number): boolean {
  return page < totalPages && totalPages > 0;
}

export interface PaginationInfo {
  totalItems: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
  startIndex: number;
  endIndex: number;
}

/**
 * Returns comprehensive pagination metadata.
 */
export function getPaginationInfo(
  totalItems: number,
  currentPage: number,
  limit: number,
): PaginationInfo {
  const totalPages = calculateTotalPages(totalItems, limit);
  const page = Math.max(1, Math.min(currentPage, totalPages || 1));

  const hasNextPage = calculateHasNextPage(page, totalPages);
  const hasPreviousPage = calculateHasPreviousPage(page);

  const startIndex = Math.max(0, (page - 1) * limit);
  const endIndex = Math.max(0, Math.min(startIndex + limit - 1, totalItems - 1));

  return {
    totalItems,
    currentPage: page,
    limit,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? page + 1 : null,
    previousPage: hasPreviousPage ? page - 1 : null,
    startIndex,
    endIndex,
  };
}

/**
 * Generates an array of page numbers for pagination UI controls with max window limits.
 */
export function paginateArrayWindow(
  currentPage: number,
  totalPages: number,
  maxWindow = 5,
): number[] {
  if (totalPages <= 0) return [];
  const half = Math.floor(maxWindow / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxWindow - 1);

  if (end - start + 1 < maxWindow) {
    start = Math.max(1, end - maxWindow + 1);
    end = Math.min(totalPages, start + maxWindow - 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

/**
 * Calculates SQL offset from page and limit.
 */
export function getPageOffset(page: number, limit: number): number {
  const validPage = Math.max(1, page || 1);
  const validLimit = Math.max(1, limit || 10);
  return (validPage - 1) * validLimit;
}

/**
 * Extracts raw node array from a GraphQL Relay connection object.
 */
export function parseRelayConnection<T>(connection: RelayConnection<T>): T[] {
  if (!connection || !Array.isArray(connection.edges)) return [];
  return connection.edges.map((edge) => edge.node);
}

/**
 * Filters items and recalculates pagination metadata dynamically.
 */
export function filterPaginatedItems<T>(
  items: T[],
  predicate: (item: T) => boolean,
  page = 1,
  limit = 10,
): { items: T[]; total: number; page: number; totalPages: number } {
  const filtered = (items || []).filter(predicate);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (Math.max(1, page) - 1) * limit;
  const pageItems = filtered.slice(offset, offset + limit);

  return { items: pageItems, total, page, totalPages };
}

/**
 * Calculates start and end indices for virtualized list rendering based on scroll position.
 */
export function calculateVirtualListItems(
  totalItems: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number,
  overscan = 3,
): { startIndex: number; endIndex: number; totalHeight: number } {
  const totalHeight = totalItems * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2);

  return { startIndex, endIndex, totalHeight };
}

/**
 * Garbage collector helper that purges cached pagination chunks outside active window bounds.
 */
export function collectPaginatedChunks<T>(
  pagesMap: Map<number, T[]>,
  activePage: number,
  windowRadius = 2,
): number {
  let purgedCount = 0;
  for (const pageNum of Array.from(pagesMap.keys())) {
    if (Math.abs(pageNum - activePage) > windowRadius) {
      pagesMap.delete(pageNum);
      purgedCount++;
    }
  }
  return purgedCount;
}

/**
 * Stitch the core offset state manager for seamless infinite scroll data chunking.
 */
export class OffsetStateManager<T> {
  private chunks = new Map<number, T[]>();
  private keyExtractor?: (item: T) => any;

  constructor(keyExtractor?: (item: T) => any) {
    this.keyExtractor = keyExtractor;
  }

  addChunk(offset: number, data: T[]) {
    this.chunks.set(offset, data);
  }

  getStitchedData(): T[] {
    const sortedOffsets = Array.from(this.chunks.keys()).sort((a, b) => a - b);
    const result: T[] = [];
    const seenKeys = new Set<any>();

    for (const offset of sortedOffsets) {
      for (const item of this.chunks.get(offset)!) {
        if (this.keyExtractor) {
          const key = this.keyExtractor(item);
          if (key !== undefined && key !== null) {
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);
          }
        }
        result.push(item);
      }
    }
    return result;
  }
}

/**
 * Hydrates and aggregates paginated data from multiple sources.
 */
export function hydrateMultiSourceAggregator<T>(sources: Array<T[]>): T[] {
  return sources.reduce((acc, source) => acc.concat(source), []);
}
export * from './optimisticUpdater';

export * from './virtualizedListRenderer';
