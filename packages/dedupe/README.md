# @typepurify/dedupe

A small utility that prevents identical ongoing asynchronous operations from executing multiple times concurrently. Part of the TypePurify ecosystem.

## Installation

```bash
npm install @typepurify/dedupe
```

## Usage

When you wrap an asynchronous function with `dedupe`, identical calls (based on their arguments) made at the same time will share the same promise rather than spawning multiple duplicate operations.

```typescript
import { dedupe } from '@typepurify/dedupe';

const fetchUserData = async (userId: number) => {
  console.log('Fetching from API...');
  const res = await fetch(`https://api.example.com/users/${userId}`);
  return res.json();
};

const dedupedFetch = dedupe(fetchUserData);

// Calling it 3 times simultaneously will only trigger ONE network request.
// All 3 variables will receive the exact same resolved value.
const [user1, user2, user3] = await Promise.all([
  dedupedFetch(123),
  dedupedFetch(123),
  dedupedFetch(123),
]);
```

### Custom Cache Keys

By default, `dedupe` uses `JSON.stringify(args)` to determine if a call is identical. You can override this using a custom `keyGenerator`.

```typescript
const dedupedFetch = dedupe(fetchUserData, {
  keyGenerator: (userId) => `user_${userId}`,
});
```
