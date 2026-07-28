# @typepurify/logger

Enterprise logging suite.

## Installation

```bash
npm install @typepurify/logger
```

## Usage

```typescript
import { createLogger } from '@typepurify/logger';

// Create a logger instance
const logger = createLogger({
  level: 'debug', // 'debug' | 'info' | 'warn' | 'error' | 'silent' (default: 'info')
  prefix: 'MyApp', // Optional prefix
  timestamp: true, // Optional ISO timestamp
});

logger.debug('This is a debug message');
// Output: [2026-07-23T15:00:00.000Z] [MyApp] This is a debug message

logger.info('User logged in', { userId: 123 });
// Output: [2026-07-23T15:00:00.000Z] [MyApp] User logged in { userId: 123 }

logger.warn('Rate limit approaching');
logger.error('Failed to connect to database', new Error('Timeout'));

// Completely silence logs
const silentLogger = createLogger({ level: 'silent' });
silentLogger.error('This will not be printed');
```

### New in v0.4.6

- Added `createFileLogger(filePath)` for lightweight and efficient file-based logging in Node.js environments.
