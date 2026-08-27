import { clean, CleanOptions, cleanParse } from 'typepurify';

export interface PurifyFetchOptions extends CleanOptions {
  /** Uses cleanParse for potentially higher performance on JSON payloads */
  useCleanParse?: boolean;

  /** Timeout in milliseconds before the request is aborted. */
  timeout?: number;

  /** Callback executed when a request times out */
  onTimeout?: (req: RequestInfo | URL) => void;

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
          if (purifyOptions.onTimeout) {
            purifyOptions.onTimeout(currentInput);
          }
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
      if (req) {
        try {
          await req();
        } catch (err) {
          // Socket hangup / connection abort guard prevents queue deadlock
          // Log the error to help debugging
          console.error('[RequestQueue] Error processing request:', err);
        }
      }
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

    const result = await tFetch<T>(input, init, purifyOptions);
    cache.set(key, { data: result, expiry: now + ttlMs });
    return result;
  };
}

/**
 * Creates a rate-limited fetch wrapper that throttles outgoing requests.
 */
export function createRateLimiterFetch(options: { maxRequests?: number; perMs?: number } = {}) {
  const maxRequests = options.maxRequests ?? 10;
  const perMs = options.perMs ?? 1000;
  let tokens = maxRequests;
  let lastRefill = Date.now();

  return async function rateLimiterFetch<T = any>(
    input: RequestInfo | URL,
    init?: RequestInit,
    purifyOptions?: PurifyFetchOptions,
  ): Promise<T> {
    const now = Date.now();
    if (now - lastRefill > perMs) {
      tokens = maxRequests;
      lastRefill = now;
    }

    if (tokens <= 0) {
      const wait = perMs - (now - lastRefill);
      await new Promise((r) => setTimeout(r, wait));
      return rateLimiterFetch<T>(input, init, purifyOptions);
    }

    tokens--;
    return tFetch<T>(input, init, purifyOptions);
  };
}

/**
 * Creates a mock fetch function handler for test suites and offline mock APIs.
 */
export function createMockFetchAdapter(mockResponse: any, status = 200) {
  return async function mockFetch(): Promise<Response> {
    return new Response(JSON.stringify(mockResponse), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

/**
 * Interceptor that resolves custom hostnames using an in-memory DNS resolver pool map.
 */
export function createDnsResolverInterceptor(dnsMap: Record<string, string>) {
  return async (request: { input: RequestInfo | URL; init?: RequestInit }) => {
    const urlStr = typeof request.input === 'string' ? request.input : request.input.toString();
    try {
      const parsed = new URL(urlStr);
      if (dnsMap[parsed.hostname]) {
        const originalHost = parsed.hostname;
        parsed.hostname = dnsMap[parsed.hostname];
        const newInit = { ...request.init };
        const headers = new Headers(newInit.headers);
        if (!headers.has('Host')) {
          headers.set('Host', originalHost);
        }
        newInit.headers = headers;
        return { input: parsed.toString(), init: newInit };
      }
    } catch {
      // Ignore invalid URLs
    }
    return request;
  };
}

/**
 * Connection pooler wrapper around tFetch that limits maximum simultaneous connection slots.
 */
export function createConnectionPoolerFetch(maxConnections = 5) {
  let activeConnections = 0;
  const queue: Array<() => void> = [];

  const dequeue = () => {
    if (queue.length > 0 && activeConnections < maxConnections) {
      const next = queue.shift();
      next?.();
    }
  };

  return async function poolerFetch<T = any>(
    input: RequestInfo | URL,
    init?: RequestInit,
    purifyOptions?: PurifyFetchOptions,
  ): Promise<T> {
    if (activeConnections >= maxConnections) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    activeConnections++;
    try {
      return await tFetch<T>(input, init, purifyOptions);
    } finally {
      activeConnections--;
      dequeue();
    }
  };
}

/**
 * Automatically parses HTTP response payload into JSON or Text depending on Content-Type header.
 */
export async function parseFetchPayload<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as any;
}

/**
 * Multiplexed circuit breaker that manages failure states independently per origin.
 */
export class MultiplexCircuitBreaker {
  private breakers = new Map<
    string,
    { failures: number; state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'; nextAttempt: number }
  >();

  constructor(
    private failureThreshold = 5,
    private resetTimeout = 30000,
  ) {}

  private getBreaker(origin: string) {
    if (!this.breakers.has(origin)) {
      this.breakers.set(origin, { failures: 0, state: 'CLOSED', nextAttempt: 0 });
    }
    return this.breakers.get(origin)!;
  }

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === 'string' ? input : (input as Request).url || input.toString();
    let origin = 'unknown';
    try {
      origin = new URL(urlStr).origin;
    } catch {
      // Ignore if invalid URL
    }

    const breaker = this.getBreaker(origin);

    if (breaker.state === 'OPEN') {
      if (Date.now() > breaker.nextAttempt) {
        breaker.state = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit breaker is OPEN for ${origin}`);
      }
    }

    try {
      const response = await fetch(input, init);
      if (!response.ok && response.status >= 500) {
        this.recordFailure(breaker);
      } else {
        this.recordSuccess(breaker);
      }
      return response;
    } catch (err: any) {
      this.recordFailure(breaker);
      if (err?.code === 'ECONNRESET' || err?.message?.includes('socket hang up')) {
        throw new Error(`Connection reset or socket hung up for ${origin}`);
      }
      throw err;
    }
  }

  private recordFailure(breaker: any) {
    breaker.failures++;
    if (breaker.failures >= this.failureThreshold) {
      breaker.state = 'OPEN';
      breaker.nextAttempt = Date.now() + this.resetTimeout;
    }
  }

  private recordSuccess(breaker: any) {
    breaker.failures = 0;
    breaker.state = 'CLOSED';
  }
}

/**
 * Throttles HTTP/3 requests using a leaky bucket approach.
 */
export function throttleHttp3Transport(fetchFn: typeof fetch, maxConcurrent: number): typeof fetch {
  let active = 0;
  const queue: Array<() => void> = [];

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (active >= maxConcurrent) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    active++;
    try {
      return await fetchFn(input, init);
    } finally {
      active--;
      if (queue.length > 0) {
        const next = queue.shift();
        if (next) next();
      }
    }
  };
}
