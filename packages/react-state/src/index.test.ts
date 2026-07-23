import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSafeState } from './index';

describe('@typepurify/react-state', () => {
  it('should initialize with state', () => {
    const { result } = renderHook(() => useSafeState(0));
    expect(result.current[0]).toBe(0);
  });

  it('should update state when mounted', () => {
    const { result } = renderHook(() => useSafeState('a'));

    act(() => {
      result.current[1]('b');
    });

    expect(result.current[0]).toBe('b');
  });

  it('should not update state when unmounted', () => {
    const { result, unmount } = renderHook(() => useSafeState(10));

    unmount();

    act(() => {
      result.current[1](20);
    });

    // Should remain 10 since it was unmounted before update
    expect(result.current[0]).toBe(10);
  });
});
