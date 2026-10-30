import { describe, it, expect } from 'vitest';
import { BiDirectionalPaginator } from './BiDirectionalPaginator';

describe('BiDirectionalPaginator', () => {
  const users = [
    { id: 'u1', name: 'User 1', nullVal: null },
    { id: 'u2', name: 'User 2', nullVal: null },
    { id: 'u3', name: 'User 3', nullVal: null },
    { id: 'u4', name: 'User 4', nullVal: null },
  ];

  it('should paginate forwards using first/after with clean nodes', () => {
    const paginator = new BiDirectionalPaginator<{ id: string; name: string }>();
    const connection = paginator.paginate(users, { first: 2 });

    expect(connection.edges).toHaveLength(2);
    expect(connection.edges[0].node.name).toBe('User 1');
    expect((connection.edges[0].node as any).nullVal).toBeUndefined();
    expect(connection.pageInfo.hasNextPage).toBe(true);
    expect(connection.pageInfo.startCursor).toBe('u1');
    expect(connection.pageInfo.endCursor).toBe('u2');

    const nextConn = paginator.paginate(users, {
      first: 2,
      after: connection.pageInfo.endCursor!,
    });
    expect(nextConn.edges).toHaveLength(2);
    expect(nextConn.edges[0].node.name).toBe('User 3');
    expect(nextConn.pageInfo.hasNextPage).toBe(false);
  });
});
