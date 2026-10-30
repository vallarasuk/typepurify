import { describe, it, expect, vi } from 'vitest';
import { BatchLogger } from './BatchLogger';

describe('BatchLogger', () => {
  it('should buffer and flush logs while redacting sensitive fields', async () => {
    const onFlush = vi.fn();
    const logger = new BatchLogger({ batchSize: 2, onFlush });

    logger.log({
      event: 'user_login',
      username: 'alice',
      password: 'supersecretpassword',
      nullField: null,
    });

    expect(logger.queueSize).toBe(1);
    expect(onFlush).not.toHaveBeenCalled();

    logger.log({
      event: 'api_request',
      apiKey: 'xyz-secret-key',
      token: 'bearer-jwt',
    });

    // Reached batchSize 2, auto-flushed
    expect(onFlush).toHaveBeenCalledTimes(1);
    const flushedBatch = onFlush.mock.calls[0][0];
    expect(flushedBatch.length).toBe(2);

    expect(flushedBatch[0].username).toBe('alice');
    expect(flushedBatch[0].password).toBe('[REDACTED]');
    expect(flushedBatch[0].nullField).toBeUndefined(); // purified!

    expect(flushedBatch[1].apiKey).toBe('[REDACTED]');
    expect(flushedBatch[1].token).toBe('[REDACTED]');

    logger.close();
  });
});
