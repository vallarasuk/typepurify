<div align="center">
  <h1>✨ @typepurify/react-state</h1>
  <p>Tiny alternative React hooks (like <code>usePurifiedState</code>, <code>useSmartForm</code>, <code>useApiQuery</code>) for form, loading, and query state that automatically sanitize.</p>
</div>

---

[![npm version](https://img.shields.io/npm/v/@typepurify/react-state.svg?style=flat-square)](https://www.npmjs.com/package/@typepurify/react-state)

## 🚀 Overview

`@typepurify/react-state` brings the zero-schema sanitization engine directly into your React component tree. It provides a suite of deeply-typed, ultra-lightweight hooks to replace heavy alternatives like React Hook Form or TanStack Query for simpler projects.

## 📦 Installation

```bash
npm install @typepurify/react-state typepurify
```

## 🛠 Features & Usage

### 1. `usePurifiedState`

A direct replacement for `useState` that automatically deep-cleans the initial state and any subsequent updates via the `typepurify` core engine.

```tsx
import { usePurifiedState } from '@typepurify/react-state';

function ProfileForm() {
  // 'null' and undefined are automatically stripped
  const [state, setState] = usePurifiedState(
    { name: 'Alice', age: null },
    { stripEmptyStrings: true },
  );

  // Output: { name: "Alice" }
}
```

### 2. `useSmartForm`

A tiny alternative to React Hook Form that gives you easy registration, values, error handling, and submission state.

```tsx
import { useSmartForm } from '@typepurify/react-state';

function ContactForm() {
  const { register, handleSubmit, errors, isSubmitting } = useSmartForm({ email: '' });

  const onSubmit = async (data) => {
    await api.post('/contact', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email}</span>}
      <button disabled={isSubmitting}>Send</button>
    </form>
  );
}
```

### 3. `useApiQuery`

A tiny alternative to TanStack Query for basic data fetching.

```tsx
import { useApiQuery } from '@typepurify/react-state';

function Dashboard() {
  const { data, isLoading, error, refetch } = useApiQuery(() =>
    fetch('/api/data').then((r) => r.json()),
  );

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return <div>{JSON.stringify(data)}</div>;
}
```

### 4. Utility Hooks

- **`useLoading()`**: Universal loading state manager for async functions.
- **`useDebounce(value, delay)`**: Simple debounce for text inputs.
- **`useLocalStorage(key, initialValue)`**: Persists your state in browser storage while maintaining perfect types.

## 🛡️ License

MIT © Vallarasu Kanthasamy
