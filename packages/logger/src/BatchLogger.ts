import { clean } from 'typepurify';

export interface BatchLoggerOptions {
  batchSize?: number;
  flushIntervalMs?: number;
  onFlush?: (batch: any[]) => void | Promise<void>;
  redactedKeys?: string[];
}

const DEFAULT_REDACTED_KEYS = ['password', 'token', 'secret', 'authorization', 'apiKey', 'cookie'];

/**
 * High-throughput asynchronous batch logging sink with automated credential redaction.
 */
export class BatchLogger {
  private buffer: any[] = [];
  private batchSize: number;
  private flushIntervalMs?: number;
  private onFlush?: (batch: any[]) => void | Promise<void>;
  private redactedKeys: Set<string>;
  private timer?: any;

  constructor(options: BatchLoggerOptions = {}) {
    this.batchSize = options.batchSize ?? 50;
    this.flushIntervalMs = options.flushIntervalMs;
    this.onFlush = options.onFlush;
    this.redactedKeys = new Set(
      (options.redactedKeys ?? DEFAULT_REDACTED_KEYS).map((k) => k.toLowerCase()),
    );

    if (this.flushIntervalMs) {
      this.timer = setInterval(() => {
        this.flush();
      }, this.flushIntervalMs);
    }
  }

  log(data: Record<string, any>): void {
    const redacted = this.redact(data);
    const purified = clean(redacted);
    this.buffer.push({
      ...purified,
      _loggedAt: new Date().toISOString(),
    });

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<any[]> {
    if (this.buffer.length === 0) return [];
    const batch = [...this.buffer];
    this.buffer = [];

    if (this.onFlush) {
      await this.onFlush(batch);
    }
    return batch;
  }

  private redact(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redact(item));
    }

    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (this.redactedKeys.has(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = this.redact(obj[key]);
      }
    }
    return result;
  }

  close(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush();
  }

  get queueSize(): number {
    return this.buffer.length;
  }
}
