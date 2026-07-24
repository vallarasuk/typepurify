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
