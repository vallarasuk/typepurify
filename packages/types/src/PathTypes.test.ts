import { describe, it, expect } from 'vitest';
import { getByPath, setByPath, type PathValue } from './PathTypes';

describe('PathTypes', () => {
  interface User {
    id: number;
    profile: {
      name: string;
      location: {
        city: string;
      };
    };
  }

  it('should extract nested values accurately by path', () => {
    const user: User = {
      id: 1,
      profile: {
        name: 'Alice',
        location: {
          city: 'London',
        },
      },
    };

    const name: PathValue<User, 'profile.name'> = getByPath(user, 'profile.name')!;
    expect(name).toBe('Alice');

    const city = getByPath(user, 'profile.location.city');
    expect(city).toBe('London');

    expect(getByPath(user, 'profile.nonexistent' as any)).toBeUndefined();
  });

  it('should set nested values accurately with prototype safety', () => {
    const obj = { a: { b: 1 } };
    setByPath(obj, 'a.b', 2);
    expect(obj.a.b).toBe(2);

    setByPath(obj, 'a.c.d', 10);
    expect((obj as any).a.c.d).toBe(10);

    // Prototype safety
    setByPath(obj, '__proto__.polluted', true);
    expect(({} as any).polluted).toBeUndefined();
  });
});
