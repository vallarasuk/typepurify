# @typepurify/retry

A lightweight, robust promise retry wrapper. Part of the TypePurify ecosystem.

## Installation

```bash
npm install @typepurify/retry
```

## Usage

```typescript
import { withRetry } from '@typepurify/retry';

async function fetchUserData() {
  const response = await fetch('https://api.example.com/user');
  if (!response.ok) throw new Error('API Error');
  return response.json();
}

// Automatically retries up to 3 times (default) with a 1 second delay
const data = await withRetry(fetchUserData);
```

### Advanced Options

```typescript
const data = await withRetry(fetchUserData, {
  retries: 5, // Retry up to 5 times
  delay: 2000, // Wait 2 seconds between retries
  onRetry: (err, attempt) => {
    console.log(`Retry attempt ${attempt} due to error: ${err.message}`);
  },
  shouldRetry: (err) => {
    // Only retry if it's a 500 server error, don't retry on 404
    return err.message.includes('500');
  },
});
```
