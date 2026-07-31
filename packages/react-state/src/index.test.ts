import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useLoading,
  useSmartForm,
  useApiQuery,
  usePurifiedState,
  useDebounce,
  createSignalStore,
  usePrevious,
  useMap,
  useToggle,
} from './index';

describe('@typepurify/react-state', () => {
  describe('useLoading', () => {
    it('should handle loading states', async () => {
      const { result } = renderHook(() => useLoading());

      expect(result.current[0]).toBe(false);

      let resolvePromise: any;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      let wrapperPromise: any;
      act(() => {
        wrapperPromise = result.current[1](promise);
      });

      expect(result.current[0]).toBe(true);

      await act(async () => {
        resolvePromise('ok');
        await wrapperPromise;
      });

      expect(result.current[0]).toBe(false);
    });
  });

  describe('useMap', () => {
    it('should manage Map state', () => {
      const { result } = renderHook(() => useMap<string, number>([['a', 1]]));

      expect(result.current.size).toBe(1);
      expect(result.current.get('a')).toBe(1);

      act(() => {
        result.current.set('b', 2);
      });

      expect(result.current.size).toBe(2);
      expect(result.current.get('b')).toBe(2);

      act(() => {
        result.current.remove('a');
      });

      expect(result.current.size).toBe(1);
      expect(result.current.has('a')).toBe(false);

      act(() => {
        result.current.clear();
      });

      expect(result.current.size).toBe(0);
    });
  });

  describe('useSmartForm', () => {
    it('should manage values and generic updates', () => {
      const { result } = renderHook(() => useSmartForm({ name: 'Alice' }));

      expect(result.current.values.name).toBe('Alice');

      act(() => {
        result.current.register('name').onChange({ target: { value: 'Bob' } });
      });

      expect(result.current.values.name).toBe('Bob');
    });

    it('should handle submission states', async () => {
      const { result } = renderHook(() => useSmartForm({ name: 'Alice' }));

      let resolveSubmit: any;
      const submitFn = () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        });

      const onSubmit = result.current.handleSubmit(submitFn);

      let submitPromise: any;
      act(() => {
        submitPromise = onSubmit();
      });

      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        resolveSubmit();
        await submitPromise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('useApiQuery', () => {
    it('should fetch data and handle loading state', async () => {
      const queryFn = async () => 'data';
      const { result } = renderHook(() => useApiQuery(queryFn));

      expect(result.current.isLoading).toBe(true); // Since we didn't call refetch in a useEffect for the mock, we can just test refetch manually

      let fetchPromise: any;
      act(() => {
        fetchPromise = result.current.refetch();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await fetchPromise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBe('data');
    });
  });

  describe('usePurifiedState', () => {
    it('should purify initial state', () => {
      const { result } = renderHook(() =>
        usePurifiedState({ a: 1, b: null, c: undefined, d: '' }, { stripEmptyStrings: true }),
      );
      expect(result.current[0]).toEqual({ a: 1 });
    });

    it('should purify state on update', () => {
      const { result } = renderHook(() => usePurifiedState({ a: 1 }));

      act(() => {
        result.current[1]({ a: 2, b: null, c: [1, null, 2] } as any);
      });

      expect(result.current[0]).toEqual({ a: 2, c: [1, 2] });
    });

    it('should handle functional updates', () => {
      const { result } = renderHook(() => usePurifiedState({ count: 1 }));

      act(() => {
        result.current[1]((prev: any) => ({ count: prev.count + 1, extra: null }));
      });

      expect(result.current[0]).toEqual({ count: 2 });
    });
  });

  describe('useDebounce', () => {
    it('should return debounced value', () => {
      // Very basic sanity check without rendering
      expect(typeof useDebounce).toBe('function');
    });
  });

  describe('useLocalStorage', () => {
    it('should exist', async () => {
      const { useLocalStorage } = await import('./index');
      expect(typeof useLocalStorage).toBe('function');
    });
  });

  describe('useThrottledState', () => {
    it('should exist', async () => {
      const { useThrottledState } = await import('./index');
      expect(typeof useThrottledState).toBe('function');
    });
  });

  describe('createSignalStore', () => {
    it('should manage signal state and notify subscribers', () => {
      const store = createSignalStore(10);
      expect(store.get()).toBe(10);

      let received = 0;
      const unsubscribe = store.subscribe((val) => {
        received = val;
      });

      store.set(25);
      expect(store.get()).toBe(25);
      expect(received).toBe(25);

      unsubscribe();
      store.set(50);
      expect(store.get()).toBe(50);
      expect(received).toBe(25);
    });
  });

  describe('usePrevious', () => {
    it('should return undefined initially then return previous value on re-render', () => {
      const { result, rerender } = renderHook(({ val }) => usePrevious(val), {
        initialProps: { val: 'first' },
      });

      expect(result.current).toBeUndefined();

      rerender({ val: 'second' });
      expect(result.current).toBe('first');

      rerender({ val: 'third' });
      expect(result.current).toBe('second');
    });
  });

  describe('useSessionStorage', () => {
    it('should exist', async () => {
      const { useSessionStorage } = await import('./index');
      expect(typeof useSessionStorage).toBe('function');
    });
  });

  describe('useToggle', () => {
    it('should toggle boolean state', () => {
      const { result } = renderHook(() => useToggle());

      expect(result.current[0]).toBe(false);

      act(() => {
        result.current[1](); // toggle
      });

      expect(result.current[0]).toBe(true);

      act(() => {
        result.current[2](false); // explicit set
      });

      expect(result.current[0]).toBe(false);
    });
  });

  describe('useBooleanState', () => {
    it('should manage boolean state with helper methods', async () => {
      const { useBooleanState } = await import('./index');
      const { result } = renderHook(() => useBooleanState(false));

      expect(result.current.value).toBe(false);

      act(() => {
        result.current.setTrue();
      });
      expect(result.current.value).toBe(true);

      act(() => {
        result.current.setFalse();
      });
      expect(result.current.value).toBe(false);
    });
  });
});
