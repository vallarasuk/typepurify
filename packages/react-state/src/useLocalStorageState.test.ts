import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorageState } from './useLocalStorageState';

describe('useLocalStorageState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should initialize and synchronize state with localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorageState<{ count: number; nullVal?: any }>('test_key', {
        count: 0,
        nullVal: null,
      }),
    );

    expect(result.current[0].count).toBe(0);
    expect(result.current[0].nullVal).toBeUndefined(); // purified!

    act(() => {
      result.current[1]({ count: 5 });
    });

    expect(result.current[0].count).toBe(5);
    expect(JSON.parse(window.localStorage.getItem('test_key')!)).toEqual({ count: 5 });
  });

  it('should reset value using clear callback', () => {
    const { result } = renderHook(() => useLocalStorageState<string>('reset_key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });
    expect(result.current[0]).toBe('updated');

    act(() => {
      result.current[2](); // clear
    });
    expect(result.current[0]).toBe('initial');
  });
});
