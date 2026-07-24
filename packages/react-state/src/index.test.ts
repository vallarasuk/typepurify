import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoading, useSmartForm, useApiQuery } from './index';

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
});
