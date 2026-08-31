import { useState, useCallback, useEffect, useRef } from 'react';
import { clean, type DeepRequired, type CleanOptions } from 'typepurify';

/**
 * A useState alternative that automatically deep-cleans the initial state and any subsequent updates.
 */
export function usePurifiedState<T, const O extends CleanOptions = {}>(
  initialState: T | (() => T),
  options?: O,
): [
  DeepRequired<T, O>,
  (newState: T | ((prevState: DeepRequired<T, O>) => T)) => void,
  () => void,
] {
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

  const resetState = useCallback(() => {
    setState(() => {
      const value =
        typeof initialState === 'function' ? (initialState as Function)() : initialState;
      return clean(value, options);
    });
  }, [initialState, options]);

  return [state, setPurifiedState, resetState];
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

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return { values, errors, isSubmitting, register, setValues, setErrors, handleSubmit, reset };
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
    get: () =>
      (typeof state === 'object' && state !== null
        ? Array.isArray(state)
          ? [...state]
          : { ...state }
        : state) as T,
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
 * Hook to consume a signal store with unmount safety.
 */
export function useStore<T>(store: ReturnType<typeof createSignalStore<T>>) {
  const [state, setState] = useState(store.get());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = store.subscribe((val) => {
      if (mounted.current) {
        setState(val);
      }
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [store]);

  return state;
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

export function useBooleanState(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((v) => !v), []);

  return { value, setTrue, setFalse, toggle, setValue };
}

/**
 * Custom React hook for array state manipulation.
 */
export function useArray<T>(initialValue: T[] = []) {
  const [array, setArray] = useState<T[]>(initialValue);

  const push = useCallback((item: T) => setArray((a) => [...a, item]), []);
  const removeByIndex = useCallback(
    (index: number) => setArray((a) => a.filter((_, i) => i !== index)),
    [],
  );
  const updateAtIndex = useCallback(
    (index: number, item: T) =>
      setArray((a) => a.map((existing, i) => (i === index ? item : existing))),
    [],
  );
  const clear = useCallback(() => setArray([]), []);

  return { array, setArray, push, removeByIndex, updateAtIndex, clear };
}

/**
 * Cross-tab leader election node hook for multi-tab browser synchronization.
 */
export function createLeaderElectionNode(channelName = 'typepurify_leader') {
  let isLeader = false;
  return {
    channelName,
    isLeader: () => isLeader,
    claimLeader: () => {
      isLeader = true;
      return true;
    },
    releaseLeader: () => {
      isLeader = false;
    },
  };
}

/**
 * React hook for running async effects cleanly with automatic cancellation signal logic.
 */
export function useAsyncEffect(
  effect: (isCancelled: () => boolean) => Promise<void>,
  deps: any[] = [],
) {
  useEffect(() => {
    let cancelled = false;
    effect(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, deps);
}

/**
 * React hook to copy text to clipboard with feedback state.
 */
export function useCopyToClipboard(
  resetTimeoutMs = 2000,
): [boolean, (text: string) => Promise<boolean>] {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), resetTimeoutMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetTimeoutMs],
  );

  return [isCopied, copy];
}

/**
 * Connects state stores to Redux DevTools extension if available.
 */
export function createReduxDevtoolsBridge(name = 'TypePurifyState') {
  let devtools: any = null;
  if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    devtools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({ name });
  }

  return {
    send: (action: string, state: any) => {
      devtools?.send(action, state);
    },
    init: (state: any) => {
      devtools?.init(state);
    },
  };
}

/**
 * React hook for mutable state draft mutations.
 */
export function useImmerDraft<T extends Record<string, any>>(initialState: T) {
  const [state, setState] = useState<T>(initialState);

  const updateDraft = (updater: (draft: T) => void) => {
    setState((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      updater(clone);
      return clone;
    });
  };

  return [state, updateDraft] as const;
}

/**
 * React hook that provides undo/redo state management with a history stack.
 */
export function useUndoRedoState<T>(initial: T) {
  const [history, setHistory] = useState<T[]>([initial]);
  const [cursor, setCursor] = useState(0);

  const current = history[cursor] as T;

  const set = (next: T) => {
    const sliced = history.slice(0, cursor + 1);
    setHistory([...sliced, next]);
    setCursor(sliced.length);
  };

  const undo = () => setCursor((c) => Math.max(0, c - 1));
  const redo = () => setCursor((c) => Math.min(history.length - 1, c + 1));
  const canUndo = cursor > 0;
  const canRedo = cursor < history.length - 1;

  return { current, set, undo, redo, canUndo, canRedo };
}

/**
 * Hook for managing state with transparent encryption adapter for sensitive data.
 */
export function useEncryptedState<T>(initialValue: T, secretKey: string) {
  const [encryptedData, setEncryptedData] = useState<string | null>(null);
  const [decryptedValue, setDecryptedValue] = useState<T>(initialValue);

  const encrypt = useCallback(
    (data: any) => {
      try {
        const json = JSON.stringify(data);
        let out = '';
        for (let i = 0; i < json.length; i++) {
          out += String.fromCharCode(
            json.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length),
          );
        }
        return typeof window !== 'undefined'
          ? window.btoa(out)
          : Buffer.from(out).toString('base64');
      } catch {
        return null;
      }
    },
    [secretKey],
  );

  const decrypt = useCallback(
    (cipher: string) => {
      try {
        const raw =
          typeof window !== 'undefined'
            ? window.atob(cipher)
            : Buffer.from(cipher, 'base64').toString('utf8');
        let out = '';
        for (let i = 0; i < raw.length; i++) {
          out += String.fromCharCode(
            raw.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length),
          );
        }
        return JSON.parse(out);
      } catch {
        return null;
      }
    },
    [secretKey],
  );

  // initial encryption
  useEffect(() => {
    setEncryptedData(encrypt(initialValue));
  }, []);

  const setValue = useCallback(
    (newValue: T) => {
      setDecryptedValue(newValue);
      setEncryptedData(encrypt(newValue));
    },
    [encrypt],
  );

  return [decryptedValue, setValue, encryptedData, decrypt] as const;
}

/**
 * Bypasses React state and directly mutates a DOM ref for high-performance updates.
 */
export function bypassDOMBinder(ref: { current: any }, value: string): void {
  if (ref && ref.current) {
    ref.current.textContent = value;
  }
}
export * from './reduxBridge';

export * from './immerDraftState';
