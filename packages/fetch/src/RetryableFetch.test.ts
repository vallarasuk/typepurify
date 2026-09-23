import { describe, it, expect } from 'vitest';
import { RetryableFetch } from './RetryableFetch';
describe('RetryableFetch', () => {
  it('should fetch', async () => {
    const f = new RetryableFetch();
    expect(await f.fetch('url')).toBe('data');
  });
});
