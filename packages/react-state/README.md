# @typepurify/react-state

Tiny alternatives for form, loading, and query state.

## Installation

```bash
npm install @typepurify/react-state
```

## Usage

### `useSafeState`

A drop-in replacement for `useState` that automatically prevents state updates if the component has been unmounted. This is very useful for avoiding the "Can't perform a React state update on an unmounted component" warning and preventing memory leaks in async operations.

```tsx
import { useSafeState } from '@typepurify/react-state';

function MyComponent() {
  const [data, setData] = useSafeState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    fetch('https://api.example.com/data')
      .then((res) => res.json())
      .then((json) => {
        // If the component unmounts before the fetch completes,
        // this state update is safely ignored!
        setData(json.message);
      });
  }, []);

  return <div>{data ?? 'Loading...'}</div>;
}
```

### `usePurifiedState`

A highly optimized state hook that deeply cleans your data (removing `null`, `undefined`, and empty structures) automatically on initialization and every state update!

```tsx
import { usePurifiedState } from '@typepurify/react-state';

function ProfileEditor() {
  // Initial state is cleaned immediately!
  const [user, setUser] = usePurifiedState({
    name: 'Alice',
    bio: null, // this gets completely dropped
    tags: [], // this gets dropped too!
  });

  return <button onClick={() => setUser({ name: 'Bob', bio: undefined })}>Update User</button>;
}
```

### New in v0.4.6

- Added `useSessionStorage(key, initialValue)` hook for persisting state in the session storage.
