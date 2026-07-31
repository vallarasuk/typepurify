import { useState, useCallback, useEffect } from 'react';
import { clean, type DeepRequired, type CleanOptions } from 'typepurify';

/**
 * A useState alternative that automatically deep-cleans the initial state and any subsequent updates.
 */
export function usePurifiedState<T, const O extends CleanOptions = {}>(
  initialState: T | (() => T),
  options?: O,
): [DeepRequired<T, O>, (newState: T | ((prevState: DeepRequired<T, O>) => T)) => void] {
  const [state, setState] = useState<DeepRequired<T, O>>(() => {
    const value = typeof initialState === 'function' ? (initialState as Function)() : initialState;
    return clean(value, options);
  });

  const setPurifiedState = useCallback(
    (newState: T | ((prevState: DeepRequired<T, O>) => T)) => {
      setState((prevState) => {
        const valueToClean =
          typeof newState === 'function' ? (newState as Function)(prevState) : newState;
        return clean(valueToClean, options);
      });
    },
    [options],
  );

  return [state, setPurifiedState];
}

/**
 * Universal loading state manager.
 * Returns a boolean and a wrapper function that automatically handles loading state for async functions.
 */
export function useLoading(): [boolean, <T>(promise: Promise<T>) => Promise<T>] {
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await promise;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return [isLoading, withLoading];
}

/**
 * Tiny alternative to React Hook Form.
 */
export function useSmartForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const register = (name: keyof T) => {
    return {
      name: name as string,
      value: values[name] || '',
      onChange: (e: any) => handleChange(name, e?.target ? e.target.value : e),
    };
  };

  const handleSubmit = (onSubmit: (data: T) => Promise<void> | void) => {
    return async (e?: { preventDefault?: () => void }) => {
      e?.preventDefault?.();
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (err: any) {
        setErrors({ _form: err?.message || 'An error occurred' } as any);
      } finally {
        setIsSubmitting(false);
      }
    };
  };

  return { values, errors, isSubmitting, register, setValues, setErrors, handleSubmit };
}

/**
 * Tiny alternative to TanStack Query.
 */
export function useApiQuery<T>(queryFn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, deps);

  return { data, isLoading, error, refetch };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
): [T, (value: T | ((val: T) => T)) => void] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item
        ? (JSON.parse(item) as T)
        : initialValue instanceof Function
          ? initialValue()
          : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
}

import { useRef } from 'react';

export function useThrottledState<T>(
  initialState: T | (() => T),
  limitMs: number,
): [T, (newState: T | ((prevState: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  const lastRan = useRef<number>(Date.now());
  const lastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setThrottledState = useCallback(
    (newState: T | ((prevState: T) => T)) => {
      const now = Date.now();

      if (now - lastRan.current >= limitMs) {
        setState(newState);
        lastRan.current = now;
      } else {
        if (lastTimeout.current) {
          clearTimeout(lastTimeout.current);
        }
        lastTimeout.current = setTimeout(
          () => {
            if (now - lastRan.current >= limitMs) {
              setState(newState);
              lastRan.current = Date.now();
            }
          },
          limitMs - (now - lastRan.current),
        );
      }
    },
    [limitMs],
  );

  return [state, setThrottledState];
}

/**
 * Signal store hook for reactive granular state tracking.
 */
export function createSignalStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<(val: T) => void>();

  return {
    get: () => state,
    set: (val: T) => {
      state = val;
      listeners.forEach((l) => l(val));
    },
    subscribe: (listener: (val: T) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * React hook that stores and returns the previous value of a variable across renders.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/**
 * A hook for managing state synced with sessionStorage.
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T | (() => T),
): [T, (value: T | ((val: T) => T)) => void] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
    try {
      const item = window.sessionStorage.getItem(key);
      return item
        ? (JSON.parse(item) as T)
        : initialValue instanceof Function
          ? initialValue()
          : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
}

/**
 * A React hook for managing Map state without mutating.
 */
export function useMap<K, V>(initialMap?: Map<K, V> | Iterable<readonly [K, V]>) {
  const [map, setMap] = useState<Map<K, V>>(() => new Map(initialMap));

  const set = useCallback((key: K, value: V) => {
    setMap((prev) => {
      const next = new Map(prev);
      next.set(key, value);
      return next;
    });
  }, []);

  const remove = useCallback((key: K) => {
    setMap((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setMap(new Map());
  }, []);

  return {
    map,
    set,
    remove,
    clear,
    size: map.size,
    has: useCallback((key: K) => map.has(key), [map]),
    get: useCallback((key: K) => map.get(key), [map]),
  };
}

/**
 * A simple hook to toggle boolean state.
 */
export function useToggle(
  initialValue: boolean = false,
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}

/**
 * Hook providing boolean state management helpers (setTrue, setFalse, toggle).
 */
export function useBooleanState(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((v) => !v), []);

  return { value, setTrue, setFalse, toggle, setValue };
}
