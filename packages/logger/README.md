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

## 🛡️ License

MIT © Vallarasu Kanthasamy
