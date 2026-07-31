import { describe, it, expect, vi } from 'vitest';
import { Logger, requestLogger, formatError, LogRateLimiter, createScopedLogger } from './index';

describe('@typepurify/logger', () => {
  describe('Logger', () => {
    it('should format logs in JSON', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = new Logger({ format: 'json', level: 'info' });

      logger.info('Test Message', { userId: 1 });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(output.level).toBe('info');
      expect(output.message).toBe('Test Message');
      expect(output.userId).toBe(1);
      expect(output.timestamp).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should safely stringify circular references', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = new Logger({ format: 'json', level: 'info' });

      const circularObj: any = { name: 'cycle' };
      circularObj.self = circularObj;

      logger.info('Circular Log', circularObj);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(output.name).toBe('cycle');
      expect(output.self.self).toBe('[Circular]');

      consoleSpy.mockRestore();
    });

    it('should correctly serialize Error objects in JSON format', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logger = new Logger({ format: 'json', level: 'error' });

      const err = new Error('Database connection failed');
      logger.error('Error Log', err);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(output.error.name).toBe('Error');
      expect(output.error.message).toBe('Database connection failed');
      expect(output.error.stack).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should respect log levels', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      consoleErrorSpy.mockClear();
      const logger = new Logger({ level: 'warn' });

      logger.info('Info message'); // Should not log
      logger.warn('Warn message'); // Should log
      logger.fatal('Fatal message'); // Should log to error console

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Warn message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Fatal message');

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should format text with color', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = new Logger({ format: 'text', colorize: true });

      logger.info('Color message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][0]).toContain('\x1b[32m'); // Green color code

      consoleLogSpy.mockRestore();
    });

    it('should not log anything if silent is true', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = new Logger({ silent: true });

      logger.info('Silent message');

      expect(consoleLogSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('requestLogger', () => {
    it('should log request on finish', () => {
      const logger = new Logger({ level: 'info' });
      const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const middleware = requestLogger(logger);

      let finishCallback: any;
      const req = { method: 'GET', originalUrl: '/api/test' };
      const res = {
        statusCode: 200,
        on: (event: string, cb: any) => {
          if (event === 'finish') finishCallback = cb;
        },
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled(); // Not called until finish

      finishCallback();

      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy.mock.calls[0][0]).toBe('GET /api/test');
      expect(infoSpy.mock.calls[0][1].status).toBe(200);

      infoSpy.mockRestore();
    });
  });

  describe('formatError', () => {
    it('should format stack trace beautifully', () => {
      const err = new Error('Test Error');
      const formatted = formatError(err);

      expect(formatted).toContain('💥 Error: Test Error');
      expect(formatted).toContain('↳');
    });
  });

  describe('LogRateLimiter', () => {
    it('should rate limit logs when limit is exceeded', () => {
      const limiter = new LogRateLimiter(2, 1000);
      expect(limiter.canLog()).toBe(true);
      expect(limiter.canLog()).toBe(true);
      expect(limiter.canLog()).toBe(false);
      limiter.destroy();
    });
  });

  describe('createScopedLogger', () => {
    it('should inject scope tag into log metadata', () => {
      const logger = new Logger({ level: 'info' });
      const spy = vi.spyOn(logger, 'info').mockImplementation(() => {});

      const scoped = createScopedLogger(logger, 'AuthModule');
      scoped.info('User logged in', { userId: 42 });

      expect(spy).toHaveBeenCalledWith('User logged in', { scope: 'AuthModule', userId: 42 });
    });
  });

  describe('createFileLogger', () => {
    it('should return a logger instance', async () => {
      const { createFileLogger } = await import('./index');
      const logger = createFileLogger('test.log');
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('sanitizeLogMeta', () => {
    it('should redact sensitive metadata keys', async () => {
      const { sanitizeLogMeta } = await import('./index');
      const meta = { username: 'alice', password: 'my-secret-password', token: 'xyz123' };

      const sanitized = sanitizeLogMeta(meta);
      expect(sanitized).toEqual({
        username: 'alice',
        password: '[REDACTED]',
        token: '[REDACTED]',
      });
    });
  });
});
