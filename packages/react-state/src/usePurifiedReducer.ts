import { useReducer, useCallback, type Reducer } from 'react';
import { clean, type CleanOptions, type DeepRequired } from 'typepurify';

export type PurifiedReducer<S, A> = (prevState: S, action: A) => S;

/**
 * usePurifiedReducer combines React's useReducer with automated state purification.
 */
export function usePurifiedReducer<S, A, const O extends CleanOptions = {}>(
  reducer: PurifiedReducer<S, A>,
  initialState: S,
  options?: O,
): [DeepRequired<S, O>, (action: A) => void] {
  const wrappedReducer: Reducer<DeepRequired<S, O>, A> = useCallback(
    (prevState, action) => {
      const nextRaw = reducer(prevState as any, action);
      return clean(nextRaw, options) as DeepRequired<S, O>;
    },
    [reducer, options],
  );

  const [state, dispatch] = useReducer(wrappedReducer, undefined as any, () => {
    return clean(initialState, options) as DeepRequired<S, O>;
  });

  return [state, dispatch];
}
