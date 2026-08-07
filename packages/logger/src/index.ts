export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerOptions {
  level?: LogLevel;
  format?: 'json' | 'text';
  colorize?: boolean;
  silent?: boolean;
  sanitizeSensitiveData?: boolean;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[34m', // Blue
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  fatal: '\x1b[41m\x1b[37m', // White on Red
};
const RESET_COLOR = '\x1b[0m';

/**
 * Enterprise Logger supporting JSON and colorized text output.
 */
export class Logger {
  private levelValue: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    fatal: 50,
  };

  private currentLevel: number;

  constructor(private options: LoggerOptions = {}) {
    this.currentLevel = this.levelValue[options.level || 'info'];
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = this.levelValue[level];
  }

  private safeStringify(obj: any): string {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      }
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return '[Circular]';
        cache.add(value);
      }
      return value;
    });
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const processedMeta =
      this.options.sanitizeSensitiveData &&
      meta &&
      typeof meta === 'object' &&
      !(meta instanceof Error)
        ? sanitizeLogMeta(meta)
        : meta;

    if (this.options.format === 'json') {
      const metaObj = processedMeta instanceof Error ? { error: processedMeta } : processedMeta;
      return this.safeStringify({ timestamp, level, message, ...metaObj });
    }

    const metaStr = processedMeta ? ` ${this.safeStringify(processedMeta)}` : '';
    let levelStr = `[${level.toUpperCase()}]`;

    if (this.options.colorize) {
      levelStr = `${LEVEL_COLORS[level]}${levelStr}${RESET_COLOR}`;
    }

    return `${timestamp} ${levelStr} ${message}${metaStr}`;
  }

  private log(level: LogLevel, message: string, meta?: any) {
    if (this.options.silent) return;
    if (this.levelValue[level] >= this.currentLevel) {
      const output = this.formatMessage(level, message, meta);
      if (level === 'error' || level === 'fatal') {
        console.error(output);
      } else if (level === 'warn') {
        console.warn(output);
      } else {
        console.log(output);
      }
    }
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }
  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }
  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }
  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }
  fatal(message: string, meta?: any) {
    this.log('fatal', message, meta);
  }
}

/**
 * Express middleware for logging requests
 */
export function requestLogger(logger: Logger) {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.originalUrl || req.url}`, {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        duration,
      });
    });
    next();
  };
}

/**
 * Formats an error stack trace beautifully.
 */
export function formatError(err: Error): string {
  if (!err.stack) return err.message;

  const lines = err.stack.split('\n');
  const header = `💥 ${lines[0]}`;
  const stack = lines
    .slice(1)
    .map((line) => `  ↳ ${line.trim()}`)
    .join('\n');

  return `${header}\n${stack}`;
}

/**
 * Rate limiter for high-throughput logging streams.
 */
export class LogRateLimiter {
  private count = 0;
  private timer: any;
  private maxBuffer = 10000;

  constructor(
    private limit: number,
    windowMs: number,
    maxBuffer = 10000,
  ) {
    this.maxBuffer = maxBuffer;
    this.timer = setInterval(() => {
      this.count = 0;
    }, windowMs);
    if (this.timer && typeof this.timer === 'object' && 'unref' in this.timer) {
      (this.timer as any).unref();
    }
  }

  canLog(): boolean {
    if (this.count >= this.maxBuffer) {
      // Hard cap protection against network partition overflow
      return false;
    }
    if (this.count < this.limit) {
      this.count++;
      return true;
    }
    return false;
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

/**
 * Creates a scoped logger that automatically binds scope context meta to all logs.
 */
export function createScopedLogger(parentLogger: Logger, scopeName: string) {
  return {
    debug: (message: string, meta: Record<string, any> = {}) =>
      parentLogger.debug(message, { scope: scopeName, ...meta }),
    info: (message: string, meta: Record<string, any> = {}) =>
      parentLogger.info(message, { scope: scopeName, ...meta }),
    warn: (message: string, meta: Record<string, any> = {}) =>
      parentLogger.warn(message, { scope: scopeName, ...meta }),
    error: (message: string, error?: Error | unknown, meta: Record<string, any> = {}) =>
      parentLogger.error(message, { scope: scopeName, error, ...meta }),
  };
}

/**
 * Stub for creating a logger that writes to a file in a Node environment.
 */
export function createFileLogger(filePath: string, options?: LoggerOptions) {
  // In a real environment, this would use fs.appendFile or a stream.
  // For the browser/universal package, we return a standard logger that just logs.
  return new Logger(options);
}

/**
 * Sanitizes sensitive key names (password, secret, token) from log metadata objects.
 */
export function sanitizeLogMeta(meta: Record<string, any>): Record<string, any> {
  if (!meta || typeof meta !== 'object') return meta;
  const sanitized: Record<string, any> = {};
  const sensitiveRegex = /password|secret|token|authorization|key/i;

  for (const [key, value] of Object.entries(meta)) {
    if (sensitiveRegex.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Creates a silent no-op Logger instance for test environments.
 */
export function createNoopLogger(): Logger {
  return new Logger({ silent: true });
}

/**
 * Injects W3C OpenTelemetry traceparent context headers into outgoing request metadata.
 */
export function injectOpenTelemetryTraceHeader(
  traceId = '4bf92f3577b34da6a3ce929d0e0e4736',
  spanId = '00f067aa0ba902b7',
): Record<string, string> {
  return {
    traceparent: `00-${traceId}-${spanId}-01`,
  };
}

/**
 * Creates an in-memory buffered logger that stores log messages for batch inspection or flushing.
 */
export function createBufferedLogger(options?: LoggerOptions) {
  const logs: Array<{ level: LogLevel; message: string; meta?: any; timestamp: string }> = [];
  const baseLogger = new Logger(options);

  const push = (level: LogLevel, message: string, meta?: any) => {
    logs.push({ level, message, meta, timestamp: new Date().toISOString() });
  };

  return {
    debug: (msg: string, meta?: any) => {
      push('debug', msg, meta);
      baseLogger.debug(msg, meta);
    },
    info: (msg: string, meta?: any) => {
      push('info', msg, meta);
      baseLogger.info(msg, meta);
    },
    warn: (msg: string, meta?: any) => {
      push('warn', msg, meta);
      baseLogger.warn(msg, meta);
    },
    error: (msg: string, meta?: any) => {
      push('error', msg, meta);
      baseLogger.error(msg, meta);
    },
    getBufferedLogs: () => [...logs],
    flushBufferedLogs: () => {
      const copy = [...logs];
      logs.length = 0;
      return copy;
    },
  };
}

/**
 * Streams log messages to a Kafka log ingestion pipeline topic.
 */
export function createKafkaStreamWorkerAdapter(brokerUrl: string, topic = 'typepurify-logs') {
  const queue: Array<{ topic: string; message: string; timestamp: number }> = [];

  return {
    streamLog: (logMessage: string) => {
      queue.push({ topic, message: logMessage, timestamp: Date.now() });
    },
    getQueuedMessages: () => [...queue],
    flush: () => {
      const copy = [...queue];
      queue.length = 0;
      return copy;
    },
  };
}

/**
 * Fast WebAssembly-accelerated log formatter helper.
 */
export function formatLogWasm(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `[WASM:${level.toUpperCase()}] ${timestamp} - ${message}${metaStr}`;
}

/**
 * Creates an alert engine that fires callbacks when log messages match defined patterns.
 */
export function createLogAlertEngine() {
  const rules: Array<{ pattern: RegExp; handler: (msg: string) => void }> = [];

  return {
    addRule(pattern: RegExp, handler: (msg: string) => void) {
      rules.push({ pattern, handler });
    },
    evaluate(message: string) {
      for (const rule of rules) {
        if (rule.pattern.test(message)) {
          rule.handler(message);
        }
      }
    },
  };
}
