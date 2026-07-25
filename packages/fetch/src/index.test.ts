import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tFetch } from './index';

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
});
