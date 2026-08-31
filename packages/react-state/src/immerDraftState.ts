export type Draft<T> = T;
export function produce<T>(base: T, recipe: (draft: Draft<T>) => void | T): T {
  const draft = JSON.parse(JSON.stringify(base));
  const result = recipe(draft);
  return result !== undefined ? result : draft;
}
import { useState, useCallback } from 'react';

/**
 * Hook for managing deeply nested React state using Immer drafts in @typepurify/react-state.
 * Allows safe, mutable-style updates to immutable state trees.
 */
export function useImmerDraft<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);

  const updateState = useCallback((updater: (draft: Draft<T>) => void | T) => {
    setState((currentState) => produce(currentState, updater));
  }, []);

  const resetState = useCallback(() => {
    setState(initialValue);
  }, [initialValue]);

  return [state, updateState, resetState] as const;
}
