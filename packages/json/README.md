# @typepurify/json

Advanced JSON manipulation utilities that seamlessly integrate with `typepurify` for prototype sanitization and safe serialization.

## Installation

```bash
npm install @typepurify/json
```

## Usage

### `safeParse`

Parses a JSON string and optionally applies `typepurify` cleaning logic. It can also accept a fallback value to avoid throwing errors on invalid JSON.

```typescript
import { safeParse } from '@typepurify/json';

// Safely parse JSON with a fallback
const data = safeParse('invalid json', { default: true });
console.log(data); // { default: true }

// Parse JSON and sanitize prototypes via typepurify core
const secureData = safeParse('{"__proto__": {"admin": true}}', undefined, {
  sanitizePrototypes: true,
});
```

### `safeStringify`

Stringifies an object safely, avoiding thrown errors from circular references by returning a fallback string (default: `{}`).

```typescript
import { safeStringify } from '@typepurify/json';

const obj: any = {};
obj.self = obj; // Circular reference

// Normally JSON.stringify(obj) would throw an error
const str = safeStringify(obj);
console.log(str); // "{}"

// With custom fallback
const strWithFallback = safeStringify(obj, '{"error": "circular reference"}');
```
