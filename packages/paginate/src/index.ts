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
