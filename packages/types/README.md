# @typepurify/types

Advanced TypeScript utility types and helpers.

## Installation

```bash
npm install @typepurify/types
```

## Usage

Simply import the types you need.

```typescript
import type {
  DeepRequired,
  DeepPartial,
  NonNullableDeep,
  Awaitable,
  AwaitedReturn,
} from '@typepurify/types';

// Example: DeepRequired
type Config = { api?: { key?: string } };
type StrictConfig = DeepRequired<Config>;
// StrictConfig is { api: { key: string } }

// Example: Awaitable
const process = (data: string): Awaitable<string> => {
  return data.toUpperCase(); // Sync
};

const processAsync = async (data: string): Awaitable<string> => {
  return Promise.resolve(data.toUpperCase()); // Async
};
```

### New in v0.4.6

- Added `RequireAtLeastOne<T>` utility type to enforce that at least one property of an object is defined.
