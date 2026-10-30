import { describe, it, expect } from 'vitest';
import { RequestInterceptorChain } from './RequestInterceptorChain';

describe('RequestInterceptorChain', () => {
  it('should transform request url and headers sequentially', async () => {
    const chain = new RequestInterceptorChain();
    chain.useRequest((url, init) => ({
      url: `${url}?apiKey=123`,
      init: {
        ...init,
        headers: { ...(init?.headers || {}), 'X-Client': 'TypePurify' },
      },
    }));

    const result = await chain.applyRequest('https://api.example.com/users');
    expect(result.url).toBe('https://api.example.com/users?apiKey=123');
    expect((result.init?.headers as any)['X-Client']).toBe('TypePurify');
  });

  it('should execute response interceptors', async () => {
    const chain = new RequestInterceptorChain();
    chain.useResponse((res) => {
      return new Response(JSON.stringify({ intercepted: true }), {
        status: res.status,
        headers: { 'X-Intercepted': 'true' },
      });
    });

    const initial = new Response('raw', { status: 200 });
    const finalRes = await chain.applyResponse(initial, 'https://example.com');
    expect(finalRes.headers.get('X-Intercepted')).toBe('true');
  });
});
