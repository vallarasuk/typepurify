export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerOptions {
  level?: LogLevel;
  format?: 'json' | 'text';
  colorize?: boolean;
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

    if (this.options.format === 'json') {
      return this.safeStringify({ timestamp, level, message, ...meta });
    }

    const metaStr = meta ? ` ${this.safeStringify(meta)}` : '';
    let levelStr = `[${level.toUpperCase()}]`;

    if (this.options.colorize) {
      levelStr = `${LEVEL_COLORS[level]}${levelStr}${RESET_COLOR}`;
    }

    return `${timestamp} ${levelStr} ${message}${metaStr}`;
  }

  private log(level: LogLevel, message: string, meta?: any) {
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
