import { describe, it, expect, vi } from 'vitest';
import { RetryableFetch } from './RetryableFetch';

describe('RetryableFetch', () => {
  it('should retry on transient HTTP 500 status and succeed', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        return new Response('Error', { status: 500 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const rf = new RetryableFetch({ retries: 3, backoffMs: 5, fetchFn: mockFetch });
    const res = await rf.fetch('https://api.example.com/test');
    expect(res.status).toBe(200);
    expect(callCount).toBe(3);
  });

  it('should retry on network throw and succeed on recovery', async () => {
    let attempts = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts === 1) throw new Error('Network offline');
      return new Response('ok', { status: 200 });
    });

    const rf = new RetryableFetch({ retries: 2, backoffMs: 5, fetchFn: mockFetch });
    const res = await rf.fetch('https://api.example.com');
    expect(res.status).toBe(200);
    expect(attempts).toBe(2);
  });
});
