import { describe, it, expect, vi } from 'vitest';
import { createRaspMiddleware } from './raspMiddleware';

describe('RaspMiddleware', () => {
  it('should block SQL injection', () => {
    const middleware = createRaspMiddleware({ blockSqlInjection: true });
    const req: any = {
      headers: { 'content-length': '50' },
      body: { query: 'SELECT * FROM users' },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
