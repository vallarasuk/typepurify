<div align="center">
  <h1>✨ @typepurify/types</h1>
  <p>Advanced TypeScript utility types and structural helpers for complex applications.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/types.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/types)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## 🚀 Overview

`@typepurify/types` provides a zero-dependency collection of deeply nested utility types and runtime helpers that enforce strict type constraints. Designed to compliment the TypePurify ecosystem, it includes everything from recursive omit/merge types to safe deep path extractors (`get()`).

## 📦 Installation

```bash
npm install @typepurify/types
```

## 🛠 Features & Examples

### 1. Advanced Structural Types

**`DeepRequired<T>` & `DeepPartial<T>`**
Recursively makes all properties of an object (and nested objects/arrays) either required or optional.

```typescript
import type { DeepRequired, DeepPartial } from '@typepurify/types';

type Config = { api?: { key?: string; timeout?: number } };

// Enforces all nested properties to be defined
type StrictConfig = DeepRequired<Config>;
// => { api: { key: string; timeout: number } }
```

**`DeepOmit<T, K>`**
Deeply removes keys from an object at any nesting level.

```typescript
import type { DeepOmit } from '@typepurify/types';

type Payload = { user: { id: string; secret: string }; secret: string };
type SafePayload = DeepOmit<Payload, 'secret'>;
// => { user: { id: string } }
```

**`DeepReadonly<T>`**
Recursively locks an object making all its nested properties immutable.

```typescript
import type { DeepReadonly } from '@typepurify/types';
const state: DeepReadonly<{ data: { items: string[] } }> = { data: { items: ['A'] } };
// state.data.items.push('B') // TS Error!
```

**`DeepMerge<T, U>`**
Recursively merges two structural types together, resolving nested properties intelligently.

**`RequireAtLeastOne<T, Keys>`**
Enforces that at least one of the specified properties must be provided.

```typescript
import type { RequireAtLeastOne } from '@typepurify/types';

type Target = RequireAtLeastOne<{ id: string; email: string }, 'id' | 'email'>;
// Valid: { id: "123" }
// Valid: { email: "a@b.com" }
// Invalid: {}
```

### 2. String & Literal Utilities

**`SnakeToCamelCase<S>`**
Converts a snake_case literal string type to camelCase.

```typescript
import type { SnakeToCamelCase } from '@typepurify/types';
type Camel = SnakeToCamelCase<'user_first_name'>; // "userFirstName"
```

### 3. JSON Utilities

Strict types for valid JSON structures:

- `JsonValue`, `JsonPrimitive`, `JsonArray`, `JsonObject`

### 4. Runtime Helpers

This package also exports lightweight runtime functions that compliment the types.

**`get<T>(obj, path, defaultValue)`**
A safe, lightweight deep property extractor that handles array and string notations safely.

```typescript
import { get } from '@typepurify/types';

const data = { users: [{ profile: { name: 'Alice' } }] };

// Safe extraction without "cannot read properties of undefined"
const name = get(data, 'users[0].profile.name', 'Unknown');
console.log(name); // "Alice"
```

**`jsonToTsType(json)`**
Generates a raw TypeScript type string representation from a JSON object at runtime.

```typescript
import { jsonToTsType } from '@typepurify/types';
console.log(jsonToTsType({ id: 1, active: true }));
// => "{ id: number; active: boolean; }"
```

## 🆕 New in v0.5.8

### `asDeepPartial<T>(value)` — Zero-Cost Deep Partial Cast

Casts any unknown value to `DeepPartial<T>` at compile time — no runtime cost.

```typescript
import { asDeepPartial } from '@typepurify/types';

const partial = asDeepPartial<User>({ name: 'Alice' });
// partial.name => "Alice" | undefined
```

### `evaluateMathOperator(a, op, b)` — Type-Safe Math

Type-safe numeric operator evaluator using the `MathOperator` type.

```typescript
import { evaluateMathOperator } from '@typepurify/types';

evaluateMathOperator(10, '+', 5); // 15
evaluateMathOperator(10, '/', 0); // NaN
```

## 🛡️ License

MIT © Vallarasu Kanthasamy

---

## 📋 Changelog

### v0.5.4 — Latest

**New Features:**

- **`RegexMatchLiteral<S, Pattern>`** — Type-level utility that extracts literal string pattern matches from a string type as a union type.

```typescript
import type { RegexMatchLiteral } from '@typepurify/types';

type Matches = RegexMatchLiteral<'hello_world_test', 'world'>;
// => 'world'
```

**Bug Fixes:**

- Prototype pollution guard added to `get()` path helper — paths containing `__proto__`, `constructor`, or `prototype` now throw safely.

### v0.5.1

- Added `RequireAtLeastOne<T>`, `MakeOptional<T, K>`, `MakeRequired<T, K>`, `DeepRequiredStrict<T>`, `Writable<T>`.
