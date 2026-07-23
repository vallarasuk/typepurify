# @typepurify/react-state

Tiny react hooks for robust state management. Part of the TypePurify ecosystem.

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
