<div align="center">
  <h1>✨ @typepurify/logger</h1>
  <p>Enterprise logging suite with JSON transports, automatic error formatting, and rate limiting.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/logger.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/logger)

## 🚀 Overview

`@typepurify/logger` is a blazing-fast logger designed for backend services. It natively supports JSON serialization (preventing circular reference crashes) and includes middleware for Express.js.

## 📦 Installation

```bash
npm install @typepurify/logger
```

## 🛠 Features & Examples

### 1. Base Logger

Create a logger with JSON or colorized text formatting.

```typescript
import { Logger } from '@typepurify/logger';

const log = new Logger({
  level: 'info',
  format: 'json', // or 'text'
  colorize: true,
  customColors: { info: '\x1b[36m' }, // Override ANSI colors (v0.5.11 🚀)
});

log.info('Server started', { port: 3000 });
log.error('Database connection failed', new Error('Timeout'));
```

### 2. Scoped Loggers

Create child loggers that automatically inherit properties.

```typescript
import { createScopedLogger } from '@typepurify/logger';

const dbLogger = createScopedLogger(log, 'Database');
dbLogger.info('Query executed', { time: '10ms' });
// Outputs JSON with { "scope": "Database", "time": "10ms" } attached
```

### 3. Express Middleware

Automatically log incoming HTTP requests and response times.

```typescript
import express from 'express';
import { requestLogger } from '@typepurify/logger';

const app = express();
app.use(requestLogger(log));
```

### 4. Utilities

- **`formatError(err)`**: Beautifully formats stack traces.
- **`LogRateLimiter`**: Prevent your logs from being flooded during high-throughput errors (e.g. while in a retry loop).
- **`createFileLogger(path, options)`**: File-backed logger stub.

### 5. Silent Mode

Easily suppress logs during test environments or specific runs.

```typescript
const log = new Logger({
  silent: true,
});
```

## 🆕 New in v0.5.8

### `createLogAlertEngine()` — Pattern-Based Log Alerting

Fires registered handler callbacks when log messages match defined RegExp rules.

```typescript
import { createLogAlertEngine } from '@typepurify/logger';

const engine = createLogAlertEngine();
engine.addRule(/ERROR/, (msg) => sendAlert(msg));
engine.evaluate('ERROR: Database unreachable'); // triggers alert
engine.evaluate('INFO: Server started'); // no-op
```

### `formatLogWasm(level, message, meta?)` — WASM Log Formatter

Fast structured log line formatter with ISO timestamp and meta serialization.

```typescript
import { formatLogWasm } from '@typepurify/logger';

const line = formatLogWasm('error', 'DB timeout', { db: 'postgres' });
// "[WASM:ERROR] 2026-08-07T... - DB timeout | {"db":"postgres"}"
```

## 🛡️ License

MIT © Vallarasu Kanthasamy

---

## 📋 Changelog

### v0.5.4 — Latest

**New Features:**

- **`injectOpenTelemetryTraceHeader(traceId, spanId)`** — Generates a W3C-compliant `traceparent` header object for distributed tracing with OpenTelemetry.

```typescript
import { injectOpenTelemetryTraceHeader } from '@typepurify/logger';

const headers = injectOpenTelemetryTraceHeader(
  '4bf92f3577b34da6a3ce929d0e0e4736',
  '00f067aa0ba902b7',
);
// => { traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' }

fetch('/api/endpoint', { headers });
```

**Bug Fixes:**

- Added `maxBuffer` cap to `LogRateLimiter` to prevent unbounded memory growth during log spikes.

### v0.5.1

- Added `silent` mode for quiet test environments.
- Added `sanitizeLogMeta` to redact sensitive fields (`password`, `token`, `secret`, etc.).
- Added `createNoopLogger` for test stubs.
- Added `createScopedLogger` for tagged context logging.

## 0.5.8 Updates

Includes new features.
