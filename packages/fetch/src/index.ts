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
