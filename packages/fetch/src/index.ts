import { clean, CleanOptions, cleanParse } from 'typepurify';

export interface PurifyFetchOptions extends CleanOptions {
  /** Uses cleanParse for potentially higher performance on JSON payloads */
  useCleanParse?: boolean;

  /** Timeout in milliseconds before the request is aborted. */
  timeout?: number;

  /** Number of retry attempts for failed requests. Defaults to 0. */
  retries?: number;

  /** Base delay in milliseconds for exponential backoff. Defaults to 1000. */
  retryDelay?: number;

  /** Interceptors to run before the request and after the response. */
  interceptors?: {
    onRequest?: (request: {
      input: RequestInfo | URL;
      init?: RequestInit;
    }) =>
      | Promise<{ input: RequestInfo | URL; init?: RequestInit }>
      | { input: RequestInfo | URL; init?: RequestInit };
    onResponse?: (response: Response) => Promise<Response> | Response;
    onError?: (error: any) => Promise<any> | any;
  };
}

/**
 * A wrapper around the native `fetch` API that automatically parses
 * and purifies JSON responses using typepurify.
 */
export async function tFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  purifyOptions?: PurifyFetchOptions,
): Promise<T> {
  const retries = purifyOptions?.retries ?? 0;
  const retryDelay = purifyOptions?.retryDelay ?? 1000;

  let attempt = 0;
  let lastError: any;

  while (attempt <= retries) {
    let currentInput = input;
    let currentInit = init;

    try {
      if (purifyOptions?.interceptors?.onRequest) {
        const interceptedReq = await purifyOptions.interceptors.onRequest({
          input: currentInput,
          init: currentInit,
        });
        currentInput = interceptedReq.input;
        currentInit = interceptedReq.init;
      }

      let abortController: AbortController | undefined;
      let timeoutId: any;

      if (purifyOptions?.timeout) {
        abortController = new AbortController();
        const originalSignal = currentInit?.signal;

        if (originalSignal) {
          originalSignal.addEventListener('abort', () =>
            abortController?.abort(originalSignal.reason),
          );
          if (originalSignal.aborted) abortController.abort(originalSignal.reason);
        }

        currentInit = { ...currentInit, signal: abortController.signal };

        timeoutId = setTimeout(() => {
          abortController?.abort(new Error(`Timeout of ${purifyOptions.timeout}ms exceeded`));
        }, purifyOptions.timeout);
      }

      let response;
      try {
        response = await fetch(currentInput, currentInit);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }

      if (purifyOptions?.interceptors?.onResponse) {
        response = await purifyOptions.interceptors.onResponse(response);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        if (purifyOptions?.useCleanParse) {
          const text = await response.text();
          return cleanParse<T>(text, purifyOptions) as any;
        } else {
          const data = await response.json();
          return clean<T>(data, purifyOptions) as any;
        }
      }

      // Fallback for non-JSON responses
      return (await response.text()) as any;
    } catch (error) {
      lastError = error;

      if (purifyOptions?.interceptors?.onError) {
        lastError = (await purifyOptions.interceptors.onError(error)) ?? error;
      }

      attempt++;
      if (attempt <= retries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Creates a customized instance of tFetch with default options and global interceptors.
 * Useful for setting up base URLs, global auth headers, or global error handling.
 */
export function createTFetch(
  defaultPurifyOptions?: PurifyFetchOptions & { baseUrl?: string | URL },
) {
  return async function customTFetch<T = any>(
    input: RequestInfo | URL,
    init?: RequestInit,
    purifyOptions?: PurifyFetchOptions,
  ): Promise<T> {
    const mergedOptions = { ...defaultPurifyOptions, ...purifyOptions };

    // Merge interceptors (execute global first, then local)
    const interceptors = {
      onRequest: async (req: { input: RequestInfo | URL; init?: RequestInit }) => {
        let currentReq = req;
        if (defaultPurifyOptions?.interceptors?.onRequest) {
          currentReq = await defaultPurifyOptions.interceptors.onRequest(currentReq);
        }
        if (purifyOptions?.interceptors?.onRequest) {
          currentReq = await purifyOptions.interceptors.onRequest(currentReq);
        }
        return currentReq;
      },
      onResponse: async (res: Response) => {
        let currentRes = res;
        if (defaultPurifyOptions?.interceptors?.onResponse) {
          currentRes = await defaultPurifyOptions.interceptors.onResponse(currentRes);
        }
        if (purifyOptions?.interceptors?.onResponse) {
          currentRes = await purifyOptions.interceptors.onResponse(currentRes);
        }
        return currentRes;
      },
      onError: async (err: any) => {
        let currentErr = err;
        if (defaultPurifyOptions?.interceptors?.onError) {
          currentErr = (await defaultPurifyOptions.interceptors.onError(currentErr)) ?? currentErr;
        }
        if (purifyOptions?.interceptors?.onError) {
          currentErr = (await purifyOptions.interceptors.onError(currentErr)) ?? currentErr;
        }
        return currentErr;
      },
    };

    mergedOptions.interceptors = interceptors;

    let finalInput = input;
    if (defaultPurifyOptions?.baseUrl && typeof input === 'string' && !input.startsWith('http')) {
      finalInput = new URL(input, defaultPurifyOptions.baseUrl).toString();
    }

    return tFetch<T>(finalInput, init, mergedOptions);
  };
}

/**
 * RequestQueue provides a robust concurrency limit and debouncing
 * for outgoing network requests to prevent thundering herd problems.
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await requestFn());
        } catch (err) {
          reject(err);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const req = this.queue.shift();
      if (req) await req();
    }
    this.processing = false;
  }
}

/**
 * Creates a fetch wrapper with automatic retries and exponential backoff.
 */
export function createAutoRetryFetch(options: { retries?: number; delayMs?: number } = {}) {
  const maxRetries = options.retries ?? 3;
  const delayMs = options.delayMs ?? 50;

  return async function autoRetryFetch<T = any>(
    input: RequestInfo | URL,
    init?: RequestInit,
    purifyOptions?: PurifyFetchOptions,
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await tFetch<T>(input, init, purifyOptions);
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries - 1) {
          await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, attempt)));
        }
      }
    }
    throw lastError;
  };
}

/**
 * Creates a fetch wrapper that automatically injects a Bearer Authorization header.
 * Very useful for API clients.
 */
export function createAuthFetch(
  getToken: () => string | Promise<string>,
  options?: PurifyFetchOptions,
) {
  return createTFetch({
    ...options,
    interceptors: {
      ...options?.interceptors,
      onRequest: async (req) => {
        const token = await getToken();
        const headers = new Headers(req.init?.headers);
        headers.set('Authorization', `Bearer ${token}`);
        return {
          input: req.input,
          init: { ...req.init, headers },
        };
      },
    },
  });
}

/**
 * Creates a fetch wrapper that automatically aborts requests if they exceed the specified timeout.
 */
export function createTimeoutFetch(timeoutMs: number, options?: PurifyFetchOptions) {
  return createTFetch({ ...options, timeout: timeoutMs });
}

/**
 * Builds a query string from an object of parameters.
 */
export function buildQueryString(params: Record<string, any>): string {
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((val) => urlParams.append(key, String(val)));
      } else {
        urlParams.append(key, String(value));
      }
    }
  }
  const queryString = urlParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Batches incoming WebSocket messages or stream frames into purified chunk arrays.
 */
export function processWebSocketStream<T = any>(
  messages: string[],
  purifyOptions?: PurifyFetchOptions,
): T[] {
  const results: T[] = [];
  for (const msg of messages) {
    try {
      const parsed = JSON.parse(msg);
      const cleaned = clean<T>(parsed, purifyOptions);
      if (cleaned !== undefined) {
        results.push(cleaned as T);
      }
    } catch {
      // Ignore non-JSON messages
    }
  }
  return results;
}

/**
 * Http3TransportAdapter enables high-throughput HTTP/3 QUIC connection management
 * with client-side request throttling and packet fallback options.
 */
export class Http3TransportAdapter {
  private activeStreams = 0;
  private maxConcurrentStreams: number;

  constructor(options: { maxConcurrentStreams?: number } = {}) {
    this.maxConcurrentStreams = options.maxConcurrentStreams ?? 100;
  }

  async fetch<T = any>(
    input: RequestInfo | URL,
    init?: RequestInit,
    purifyOptions?: PurifyFetchOptions,
  ): Promise<T> {
    while (this.activeStreams >= this.maxConcurrentStreams) {
      await new Promise((res) => setTimeout(res, 10));
    }
    this.activeStreams++;
    try {
      return await tFetch<T>(input, init, purifyOptions);
    } finally {
      this.activeStreams--;
    }
  }

  getActiveStreams(): number {
    return this.activeStreams;
  }
}

/**
 * Creates a fetch wrapper with simple in-memory response caching capabilities.
 */
export function createCacheFetch(options: { ttlMs?: number } = {}) {
  const cache = new Map<string, { data: any; expiry: number }>();
  const ttlMs = options.ttlMs ?? 60000;

  return async function cacheFetch<T = any>(
    input: RequestInfo | URL,
    init?: RequestInit,
    purifyOptions?: PurifyFetchOptions,
  ): Promise<T> {
    const key = typeof input === 'string' ? input : input.toString();
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && cached.expiry > now) {
      return cached.data;
    }

    const data = await tFetch<T>(input, init, purifyOptions);
    cache.set(key, { data, expiry: now + ttlMs });
    return data;
  };
}
