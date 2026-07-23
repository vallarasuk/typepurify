import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * A drop-in replacement for useState that automatically prevents
 * state updates if the component has been unmounted.
 * This is useful for avoiding memory leaks and React warnings
 * when dealing with asynchronous operations.
 */
export function useSafeState<T>(
  initialState: T | (() => T),
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialState);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const setSafeState = useCallback((value: React.SetStateAction<T>) => {
    if (isMounted.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState];
}
