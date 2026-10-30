import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePurifiedReducer } from './usePurifiedReducer';

describe('usePurifiedReducer', () => {
  interface State {
    user: {
      name: string;
      role?: string | null;
    };
  }

  type Action = { type: 'SET_NAME'; name: string } | { type: 'SET_ROLE'; role: string | null };

  const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case 'SET_NAME':
        return { ...state, user: { ...state.user, name: action.name } };
      case 'SET_ROLE':
        return { ...state, user: { ...state.user, role: action.role } };
      default:
        return state;
    }
  };

  it('should reduce state and automatically purify null and undefined values', () => {
    const { result } = renderHook(() =>
      usePurifiedReducer(reducer, {
        user: { name: 'Alice', role: null },
      }),
    );

    expect(result.current[0].user.name).toBe('Alice');
    expect((result.current[0].user as any).role).toBeUndefined(); // initialized purified

    act(() => {
      result.current[1]({ type: 'SET_NAME', name: 'Bob' });
    });
    expect(result.current[0].user.name).toBe('Bob');

    act(() => {
      result.current[1]({ type: 'SET_ROLE', role: null });
    });
    expect((result.current[0].user as any).role).toBeUndefined(); // action purified
  });
});
