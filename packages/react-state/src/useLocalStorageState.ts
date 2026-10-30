import { useState, useCallback } from 'react';
import { clean, type CleanOptions, type DeepRequired } from 'typepurify';

/**
 * useLocalStorageState synchronizes state with browser localStorage while purifying values.
 */
export function useLocalStorageState<T, const O extends CleanOptions = {}>(
  key: string,
  initialValue: T | (() => T),
  options?: O,
): [DeepRequired<T, O>, (val: T | ((prev: DeepRequired<T, O>) => T)) => void, () => void] {
  const getInitial = (): DeepRequired<T, O> => {
    const fallback =
      typeof initialValue === 'function' ? (initialValue as Function)() : initialValue;
    if (typeof window === 'undefined' || !window.localStorage) {
      return clean(fallback, options) as DeepRequired<T, O>;
    }
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        return clean(JSON.parse(stored), options) as DeepRequired<T, O>;
      }
    } catch {
      // fallback on JSON parse failure or storage restriction
    }
    return clean(fallback, options) as DeepRequired<T, O>;
  };

  const [state, setState] = useState<DeepRequired<T, O>>(getInitial);

  const setValue = useCallback(
    (value: T | ((prev: DeepRequired<T, O>) => T)) => {
      setState((prev) => {
        const nextVal = typeof value === 'function' ? (value as Function)(prev) : value;
        const cleaned = clean(nextVal, options) as DeepRequired<T, O>;
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(key, JSON.stringify(cleaned));
          } catch {
            // quota exceeded or disabled
          }
        }
        return cleaned;
      });
    },
    [key, options],
  );

  const removeValue = useCallback(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        void 0;
      }
    }
    const fallback =
      typeof initialValue === 'function' ? (initialValue as Function)() : initialValue;
    setState(clean(fallback, options) as DeepRequired<T, O>);
  }, [key, initialValue, options]);

  return [state, setValue, removeValue];
}
