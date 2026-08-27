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

    it('should apply custom colors if provided', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = new Logger({
        format: 'text',
        colorize: true,
        customColors: { info: '\x1b[35m' },
      });

      logger.info('Custom color message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][0]).toContain('\x1b[35m');

      consoleLogSpy.mockRestore();
    });

    it('should sanitize sensitive metadata when sanitizeSensitiveData is true', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = new Logger({ format: 'json', level: 'info', sanitizeSensitiveData: true });

      logger.info('User Auth', { user: 'bob', secretKey: 'topsecret' });

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(output.user).toBe('bob');
      expect(output.secretKey).toBe('[REDACTED]');

      consoleSpy.mockRestore();
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

  describe('createNoopLogger', () => {
    it('should create silent logger instance', async () => {
      const { createNoopLogger } = await import('./index');
      const logger = createNoopLogger();
      expect(logger).toBeDefined();
    });
  });

  describe('injectOpenTelemetryTraceHeader', () => {
    it('should inject W3C traceparent header', async () => {
      const { injectOpenTelemetryTraceHeader } = await import('./index');
      const headers = injectOpenTelemetryTraceHeader('1234', '5678');
      expect(headers).toEqual({ traceparent: '00-1234-5678-01' });
    });
  });

  describe('createBufferedLogger', () => {
    it('should buffer and flush logs', async () => {
      const { createBufferedLogger } = await import('./index');
      const logger = createBufferedLogger({ silent: true });

      logger.info('Message 1', { a: 1 });
      logger.warn('Message 2');

      expect(logger.getBufferedLogs().length).toBe(2);

      const flushed = logger.flushBufferedLogs();
      expect(flushed.length).toBe(2);
      expect(flushed[0].message).toBe('Message 1');
      expect(logger.getBufferedLogs().length).toBe(0);
    });
  });

  describe('createKafkaStreamWorkerAdapter', () => {
    it('should queue and flush Kafka stream logs', async () => {
      const { createKafkaStreamWorkerAdapter } = await import('./index');
      const worker = createKafkaStreamWorkerAdapter('kafka:9092');
      worker.streamLog('log-entry-1');
      expect(worker.getQueuedMessages().length).toBe(1);
      const flushed = worker.flush();
      expect(flushed[0].message).toBe('log-entry-1');
      expect(worker.getQueuedMessages().length).toBe(0);
    });
  });

  describe('formatLogWasm', () => {
    it('should format logs using formatLogWasm', async () => {
      const { formatLogWasm } = await import('./index');
      const formatted = formatLogWasm('info', 'System ready');
      expect(formatted).toContain('[WASM:INFO]');
      expect(formatted).toContain('System ready');
    });
  });

  describe('createLogAlertEngine', () => {
    it('should trigger handler when pattern matches', async () => {
      const { createLogAlertEngine } = await import('./index');
      const engine = createLogAlertEngine();
      const triggered: string[] = [];
      engine.addRule(/ERROR/, (msg) => triggered.push(msg));
      engine.evaluate('INFO: all good');
      expect(triggered).toHaveLength(0);
      engine.evaluate('ERROR: something failed');
      expect(triggered).toHaveLength(1);
      expect(triggered[0]).toContain('ERROR');
    });
  });

  describe('redactPii', () => {
    it('should redact emails, SSNs, and phone numbers', async () => {
      const { redactPii } = await import('./index');
      const text = 'User john.doe@example.com called 555-123-4567 and SSN is 123-45-6789.';
      const redacted = redactPii(text);
      expect(redacted).toContain('[EMAIL REDACTED]');
      expect(redacted).toContain('[PHONE REDACTED]');
      expect(redacted).toContain('[SSN REDACTED]');
      expect(redacted).not.toContain('john.doe@example.com');
      expect(redacted).not.toContain('555-123-4567');
      expect(redacted).not.toContain('123-45-6789');
    });
  });
  describe('createBufferedLogger maxBufferSize', () => {
    it('should work', async () => {
      const { createBufferedLogger } = await import('./index');
      const logger = createBufferedLogger({ maxBufferSize: 2 });
      logger.info('1');
      logger.info('2');
      logger.info('3');
      const logs = logger.getBufferedLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].message).toBe('2');
      expect(logs[1].message).toBe('3');
    });
  });
  describe('optimizeEdgeWorkerLogger', () => {
    it('should batch and flush logs', async () => {
      const { optimizeEdgeWorkerLogger } = await import('./index');
      const logger = new optimizeEdgeWorkerLogger();
      logger.log('msg1');
      logger.log('msg2');
      const flushed = logger.flush();
      expect(flushed).toEqual(['msg1', 'msg2']);
      expect(logger.flush()).toEqual([]);
    });
  });
});
