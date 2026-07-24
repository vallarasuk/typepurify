import { describe, it, expect, vi } from 'vitest';
import { Logger, requestLogger, formatError } from './index';

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

    it('should respect log levels', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const logger = new Logger({ level: 'warn' });

      logger.info('Info message'); // Should not log
      logger.warn('Warn message'); // Should log

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Warn message');

      consoleWarnSpy.mockRestore();
    });

    it('should format text with color', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = new Logger({ format: 'text', colorize: true });

      logger.info('Color message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][0]).toContain('\x1b[32m'); // Green color code

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
});
