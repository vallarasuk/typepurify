<div align="center">
  <h1>✨ @typepurify/json</h1>
  <p>Advanced JSON manipulation tools with safe parsing, diffing, and circular reference handling.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/json.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/json)

## 🚀 Overview

`@typepurify/json` provides enterprise-grade JSON utilities. It features safe parsers that never throw errors, circular-reference-safe stringifiers, JSON repair tools, and deep-diffing engines.

## 📦 Installation

```bash
npm install @typepurify/json
```

## 🛠 Features & Examples

### 1. Safe Parsing & Stringifying

```typescript
import { safeParse, safeJsonStringify } from '@typepurify/json';

// Safe Parse: Never throws, falls back to a default value
const data = safeParse('{ bad json }', { fallback: true });

// Safe Stringify: Automatically detects and removes circular references!
const obj: any = { name: 'Alice' };
obj.self = obj;

const jsonStr = safeJsonStringify(obj); // Output: {"name":"Alice"}
```

### 2. JSON Diffing

Deeply compare two JSON objects and get the exact differences.

```typescript
import { deepDiff } from '@typepurify/json';

const oldObj = { id: 1, name: 'Alice' };
const newObj = { id: 1, name: 'Bob', age: 30 };

const changes = deepDiff(oldObj, newObj);
// => { name: { old: "Alice", new: "Bob" }, age: { added: 30 } }
```

### 3. Repair Broken JSON

Tries to fix common JSON syntax errors (missing quotes, trailing commas, single quotes).

```typescript
import { repairJson } from '@typepurify/json';

const fixed = repairJson("{ 'name': 'Alice', }"); // => '{"name": "Alice"}'
```

### 4. Utilities

- `jsonSize(obj)`: Accurately estimates the byte size of an object if it were to be stringified.
- `deepMerge(target, ...sources)`: Deeply merges multiple objects.
- `flattenCsvToJson(csv)`: Converts CSV strings into flat JSON objects.
- `jsonToXml(obj)`: Converts JSON maps into clean XML representations.

### 5. String Validation

Safely check if a string is parseable JSON before attempting to parse it.

```typescript
import { isJsonString } from '@typepurify/json';

if (isJsonString(input)) {
  // Safe to parse
}
```

## 🛡️ License

MIT © Vallarasu Kanthasamy
