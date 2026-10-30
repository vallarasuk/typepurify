export interface RetryableFetchOptions {
  retries?: number;
  backoffMs?: number;
  retryOnStatuses?: number[];
  fetchFn?: typeof fetch;
}

/**
 * Robust fetch wrapper that performs retries on network failures or transient 5xx/429 HTTP statuses.
 */
export class RetryableFetch {
  private retries: number;
  private backoffMs: number;
  private retryOnStatuses: Set<number>;
  private fetchFn: typeof fetch;

  constructor(options: RetryableFetchOptions = {}) {
    this.retries = options.retries ?? 3;
    this.backoffMs = options.backoffMs ?? 10;
    this.retryOnStatuses = new Set(options.retryOnStatuses ?? [408, 429, 500, 502, 503, 504]);
    this.fetchFn = options.fetchFn ?? ((url, init) => globalThis.fetch(url, init));
  }

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await this.fetchFn(url, init);
        if (attempt < this.retries && this.retryOnStatuses.has(response.status)) {
          await new Promise((r) => setTimeout(r, this.backoffMs * Math.pow(2, attempt)));
          continue;
        }
        return response;
      } catch (err) {
        lastError = err;
        if (attempt < this.retries) {
          await new Promise((r) => setTimeout(r, this.backoffMs * Math.pow(2, attempt)));
          continue;
        }
        throw lastError;
      }
    }

    throw lastError ?? new Error('Fetch failed after retries');
  }
}
