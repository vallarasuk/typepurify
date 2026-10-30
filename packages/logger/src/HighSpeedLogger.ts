export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  meta?: Record<string, any>;
}

export interface LoggerOptions {
  minLevel?: LogLevel;
  outputFn?: (entry: LogEntry) => void;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * High-speed structured logger with severity levels and filtering.
 */
export class HighSpeedLogger {
  private minLevel: LogLevel;
  private outputFn?: (entry: LogEntry) => void;
  private history: LogEntry[] = [];

  constructor(options: LoggerOptions = {}) {
    this.minLevel = options.minLevel ?? 'info';
    this.outputFn = options.outputFn;
  }

  log(msg: string, meta?: Record<string, any>): LogEntry | null {
    return this.info(msg, meta);
  }

  debug(msg: string, meta?: Record<string, any>): LogEntry | null {
    return this.write('debug', msg, meta);
  }

  info(msg: string, meta?: Record<string, any>): LogEntry | null {
    return this.write('info', msg, meta);
  }

  warn(msg: string, meta?: Record<string, any>): LogEntry | null {
    return this.write('warn', msg, meta);
  }

  error(msg: string, meta?: Record<string, any>): LogEntry | null {
    return this.write('error', msg, meta);
  }

  private write(level: LogLevel, message: string, meta?: Record<string, any>): LogEntry | null {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.minLevel]) {
      return null;
    }
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(meta ? { meta } : {}),
    };
    this.history.push(entry);
    this.outputFn?.(entry);
    return entry;
  }

  getHistory(): LogEntry[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }
}
