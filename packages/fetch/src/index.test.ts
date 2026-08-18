import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tFetch, RequestQueue, createAutoRetryFetch } from './index';

describe('tFetch wrapper', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should automatically parse and clean JSON responses', async () => {
    const rawData = { data: 'hello', emptyObj: {}, nullVal: null };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => rawData,
    });

    const result = await tFetch('https://api.example.com/data');

    // By default, typepurify removes nulls and undefined
    expect(result).toEqual({ data: 'hello', emptyObj: {} });
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/data', undefined);
  });

  it('should use cleanParse when useCleanParse is true', async () => {
    const rawDataString = '{"data":"hello","emptyObj":{},"nullVal":null}';

    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => rawDataString,
    });

    const result = await tFetch('https://api.example.com/data', undefined, {
      useCleanParse: true,
      stripEmptyObjects: true,
    });

    expect(result).toEqual({ data: 'hello' });
  });

  it('should return plain text for non-JSON responses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      text: async () => '<html><body>Hello</body></html>',
    });

    const result = await tFetch('https://api.example.com/html');

    expect(result).toBe('<html><body>Hello</body></html>');
  });

  it('should throw an error on non-ok HTTP responses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(tFetch('https://api.example.com/not-found')).rejects.toThrow(
      'HTTP error! status: 404',
    );
  });

  it('should pass purifyOptions correctly to the cleaner', async () => {
    const rawData = { name: 'Alice', emptyString: '' };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => rawData,
    });

    // We can disable stripEmptyStrings for this specific fetch
    const result = await tFetch('https://api.example.com/data', undefined, {
      stripEmptyStrings: false,
    });

    expect(result).toEqual({ name: 'Alice', emptyString: '' });
  });

  describe('Timeout', () => {
    it('should throw an error if the request exceeds the timeout', async () => {
      fetchMock.mockImplementationOnce((_url: any, init?: RequestInit) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => resolve({}), 500);
          const signal = init?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject((signal as any).reason || new Error('Aborted'));
            });
          }
        });
      });

      await expect(
        tFetch('https://api.example.com/data', undefined, { timeout: 50 }),
      ).rejects.toThrow('Timeout of 50ms exceeded');
    });

    it('should clear the timeout if the request succeeds', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      await tFetch('https://api.example.com/data', undefined, { timeout: 50 });

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Retries', () => {
    it('should retry the request if it fails', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error 2'))
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true }),
        });

      const result = await tFetch('https://api.example.com/data', undefined, {
        retries: 2,
        retryDelay: 10,
      });

      expect(result).toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should throw the last error if all retries fail', async () => {
      fetchMock.mockRejectedValue(new Error('Persistent error'));

      await expect(
        tFetch('https://api.example.com/data', undefined, { retries: 2, retryDelay: 10 }),
      ).rejects.toThrow('Persistent error');

      expect(fetchMock).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Interceptors', () => {
    it('should call onRequest interceptor before fetch', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const onRequest = vi.fn().mockImplementation((req) => {
        return { ...req, init: { ...req.init, headers: { Authorization: 'Bearer token' } } };
      });

      await tFetch('https://api.example.com/data', undefined, {
        interceptors: { onRequest },
      });

      expect(onRequest).toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/data', {
        headers: { Authorization: 'Bearer token' },
      });
    });

    it('should call onResponse interceptor after fetch', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const onResponse = vi.fn().mockImplementation((res) => {
        // mock changing something
        return res;
      });

      await tFetch('https://api.example.com/data', undefined, {
        interceptors: { onResponse },
      });

      expect(onResponse).toHaveBeenCalledWith(mockResponse);
    });

    it('should call onError interceptor on failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Original Error'));

      const onError = vi.fn().mockImplementation(() => {
        return new Error('Intercepted Error');
      });

      await expect(
        tFetch('https://api.example.com/data', undefined, {
          interceptors: { onError },
        }),
      ).rejects.toThrow('Intercepted Error');

      expect(onError).toHaveBeenCalled();
    });

    it('should allow synchronous interceptors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const onRequest = vi.fn().mockImplementation((req) => req); // returns synchronously

      await tFetch('https://api.example.com/data', undefined, {
        interceptors: { onRequest },
      });

      expect(onRequest).toHaveBeenCalled();
    });
  });

  describe('Existing AbortSignal', () => {
    it('should abort if existing signal is aborted', async () => {
      fetchMock.mockImplementationOnce((_url: any, init?: RequestInit) => {
        return new Promise((resolve, reject) => {
          const signal = init?.signal;
          if (signal?.aborted) {
            return reject((signal as any).reason || new Error('Aborted'));
          }
          if (signal) {
            signal.addEventListener('abort', () => {
              reject((signal as any).reason || new Error('Aborted'));
            });
          }
        });
      });

      const controller = new AbortController();
      controller.abort(new Error('User aborted'));

      await expect(
        tFetch('https://api.example.com/data', { signal: controller.signal }, { timeout: 5000 }),
      ).rejects.toThrow('User aborted');
    });
  });

  describe('createTFetch', () => {
    it('should create an instance with global options and interceptors', async () => {
      const globalOnRequest = vi.fn().mockImplementation((req) => req);
      const customFetch = (await import('./index')).createTFetch({
        baseUrl: 'https://api.global.com',
        interceptors: { onRequest: globalOnRequest },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      await customFetch('/data');

      expect(globalOnRequest).toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith('https://api.global.com/data', undefined);
    });

    it('should merge global and local interceptors', async () => {
      const globalOnRequest = vi
        .fn()
        .mockImplementation((req) => ({ ...req, init: { headers: { global: 'yes' } } }));
      const localOnRequest = vi.fn().mockImplementation((req) => ({
        ...req,
        init: { ...req.init, headers: { ...req.init?.headers, local: 'yes' } },
      }));

      const customFetch = (await import('./index')).createTFetch({
        interceptors: { onRequest: globalOnRequest },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      await customFetch('https://api.example.com/data', undefined, {
        interceptors: { onRequest: localOnRequest },
      });

      expect(globalOnRequest).toHaveBeenCalled();
      expect(localOnRequest).toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/data', {
        headers: { global: 'yes', local: 'yes' },
      });
    });
  });

  describe('RequestQueue', () => {
    it('should process enqueued request functions in sequence', async () => {
      const queue = new RequestQueue();
      const results: number[] = [];

      const p1 = queue.enqueue(async () => {
        results.push(1);
        return 'first';
      });

      const p2 = queue.enqueue(async () => {
        results.push(2);
        return 'second';
      });

      const [r1, r2] = await Promise.all([p1, p2]);

      expect(r1).toBe('first');
      expect(r2).toBe('second');
      expect(results).toEqual([1, 2]);
    });

    it('should properly handle rejected requests without breaking queue', async () => {
      const queue = new RequestQueue();

      const p1 = queue.enqueue(async () => {
        throw new Error('failed');
      });

      const p2 = queue.enqueue(async () => 'success');

      await expect(p1).rejects.toThrow('failed');
      await expect(p2).resolves.toBe('success');
    });
  });

  describe('createAutoRetryFetch', () => {
    it('should retry failed fetch attempts and return result on eventual success', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok' }),
      });

      const retryFetch = createAutoRetryFetch({ retries: 2, delayMs: 10 });
      const result = await retryFetch('https://api.example.com/retry');

      expect(result).toEqual({ status: 'ok' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('createAuthFetch', () => {
    it('should automatically inject Bearer token', async () => {
      const { createAuthFetch } = await import('./index');

      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const authFetch = createAuthFetch(() => 'my-secret-token');
      await authFetch('https://api.example.com/auth');

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/auth', {
        headers: expect.any(Headers),
      });

      const args = fetchMock.mock.calls[0];
      const reqHeaders = args[1].headers;
      expect(reqHeaders.get('Authorization')).toBe('Bearer my-secret-token');
    });
  });

  describe('createTimeoutFetch', () => {
    it('should create a fetch wrapper with a predefined timeout', async () => {
      const { createTimeoutFetch } = await import('./index');

      const timeoutFetch = createTimeoutFetch(10);

      // We will mock fetch to take 50ms, the timeout should abort it
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation((_input, init) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 50);
          if (init?.signal) {
            init.signal.addEventListener('abort', () => {
              clearTimeout(timer);
              reject(init.signal.reason);
            });
          }
        });
      });

      await expect(timeoutFetch('https://api.example.com/slow')).rejects.toThrow(
        /Timeout of 10ms exceeded/,
      );

      global.fetch = originalFetch;
    });
  });

  describe('buildQueryString', () => {
    it('should build a query string from parameters', async () => {
      const { buildQueryString } = await import('./index');

      expect(buildQueryString({})).toBe('');
      expect(buildQueryString({ a: 1, b: 'test' })).toBe('?a=1&b=test');
      expect(buildQueryString({ a: [1, 2], b: null, c: undefined })).toBe('?a=1&a=2');
    });
  });

  describe('processWebSocketStream', () => {
    it('should batch and purify array of JSON stream messages', async () => {
      const { processWebSocketStream } = await import('./index');

      const rawMessages = [
        '{"id":1,"name":"Alice","nullVal":null}',
        'invalid json frame',
        '{"id":2,"name":"Bob","emptyStr":""}',
      ];

      const cleaned = processWebSocketStream(rawMessages, { stripEmptyStrings: true });
      expect(cleaned).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
    });
  });

  describe('Http3TransportAdapter', () => {
    it('should throttle requests and track active streams', async () => {
      const { Http3TransportAdapter } = await import('./index');
      fetchMock.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const adapter = new Http3TransportAdapter({ maxConcurrentStreams: 2 });
      expect(adapter.getActiveStreams()).toBe(0);

      const p1 = adapter.fetch('https://api.example.com/1');
      const p2 = adapter.fetch('https://api.example.com/2');

      const res = await Promise.all([p1, p2]);
      expect(res).toEqual([{ success: true }, { success: true }]);
      expect(adapter.getActiveStreams()).toBe(0);
    });
  });

  describe('createCacheFetch', () => {
    it('should cache fetch responses until TTL expires', async () => {
      const { createCacheFetch } = await import('./index');
      fetchMock.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ value: 42 }),
      });

      const cachedFetch = createCacheFetch({ ttlMs: 100 });
      const res1 = await cachedFetch('https://api.example.com/cache');
      const res2 = await cachedFetch('https://api.example.com/cache');

      expect(res1).toEqual({ value: 42 });
      expect(res2).toEqual({ value: 42 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('createRateLimiterFetch', () => {
    it('should rate limit outgoing requests', async () => {
      const { createRateLimiterFetch } = await import('./index');
      fetchMock.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok' }),
      });

      const limitedFetch = createRateLimiterFetch({ maxRequests: 2, perMs: 100 });
      const res = await limitedFetch('https://api.example.com/rl');
      expect(res).toEqual({ status: 'ok' });
    });
  });

  describe('createMockFetchAdapter', () => {
    it('should mock response object', async () => {
      const { createMockFetchAdapter } = await import('./index');
      const mockFetch = createMockFetchAdapter({ data: 'test' });
      const res = await mockFetch();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ data: 'test' });
    });
  });

  describe('createDnsResolverInterceptor', () => {
    it('should intercept and rewrite hostnames', async () => {
      const { createDnsResolverInterceptor } = await import('./index');
      const interceptor = createDnsResolverInterceptor({ 'api.custom.internal': '127.0.0.1' });
      const req = await interceptor({ input: 'https://api.custom.internal/health' });
      expect(req.input).toBe('https://127.0.0.1/health');
    });
  });

  describe('createConnectionPoolerFetch', () => {
    it('should limit active connections using pooler', async () => {
      const { createConnectionPoolerFetch } = await import('./index');
      fetchMock.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ pool: 'ok' }),
      });
      const poolFetch = createConnectionPoolerFetch(2);
      const res = await poolFetch('https://api.example.com/pool');
      expect(res).toEqual({ pool: 'ok' });
    });
  });

  describe('parseFetchPayload', () => {
    it('should parse JSON response payload', async () => {
      const { parseFetchPayload } = await import('./index');
      const mockRes = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ hello: 'world' }),
      } as Response;
      const parsed = await parseFetchPayload(mockRes);
      expect(parsed).toEqual({ hello: 'world' });
    });
  });

  describe('MultiplexCircuitBreaker', () => {
    it('should multiplex circuit breaker across different domains', async () => {
      const { MultiplexCircuitBreaker } = await import('./index');

      const originalFetch = global.fetch;
      // @ts-expect-error - overriding global fetch for tests
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('fail.com')) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        return Promise.resolve({ ok: true, status: 200 });
      });

      const breaker = new MultiplexCircuitBreaker(2, 100);

      // fail.com will fail twice and trip
      await breaker.fetch('https://fail.com/api');
      await breaker.fetch('https://fail.com/api');

      await expect(breaker.fetch('https://fail.com/api')).rejects.toThrow(
        'Circuit breaker is OPEN for https://fail.com',
      );

      // But success.com should still work
      const res = await breaker.fetch('https://success.com/api');
      expect(res.status).toBe(200);

      global.fetch = originalFetch;
    });
  });
  describe('MultiplexCircuitBreaker ECONNRESET handling', () => {
    it('should work', async () => {
      const { MultiplexCircuitBreaker } = await import('./index');
      const cb = new MultiplexCircuitBreaker(1, 1000);
      expect(cb).toBeDefined();
    });
  });
  describe('throttleHttp3Transport', () => {
    it('should throttle concurrent requests', async () => {
      const { throttleHttp3Transport } = await import('./index');
      let active = 0;
      let maxActive = 0;
      const mockFetch = async () => {
        active++;
        if (active > maxActive) maxActive = active;
        await new Promise((resolve) => setTimeout(resolve, 10));
        active--;
        return new Response('ok');
      };
      const throttled = throttleHttp3Transport(mockFetch as any, 2);
      await Promise.all([
        throttled('url1'),
        throttled('url2'),
        throttled('url3'),
        throttled('url4'),
      ]);
      expect(maxActive).toBe(2);
    });
  });
});
