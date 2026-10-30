import { clean } from 'typepurify';

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface Connection<T> {
  edges: Array<{ cursor: string; node: T }>;
  pageInfo: PageInfo;
  totalCount: number;
}

export interface PaginationArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

/**
 * Enterprise GraphQL/Relay-compliant bidirectional keyset paginator.
 */
export class BiDirectionalPaginator<T = any> {
  private getCursor: (item: T) => string;

  constructor(getCursor?: (item: T) => string) {
    this.getCursor =
      getCursor ??
      ((item: any) =>
        item?.id !== undefined
          ? String(item.id)
          : Buffer.from(JSON.stringify(item)).toString('base64url'));
  }

  paginate(rawItems: T[], args: PaginationArgs = {}): Connection<T> {
    const items = rawItems.map((item) => clean(item) as T);
    let startIndex = 0;
    let endIndex = items.length;

    if (args.after) {
      const idx = items.findIndex((item) => this.getCursor(item) === args.after);
      if (idx !== -1) {
        startIndex = idx + 1;
      }
    }

    if (args.before) {
      const idx = items.findIndex((item) => this.getCursor(item) === args.before);
      if (idx !== -1) {
        endIndex = idx;
      }
    }

    let sliced = items.slice(startIndex, endIndex);

    if (args.first !== undefined) {
      if (args.first < 0) throw new Error('"first" argument cannot be negative');
      sliced = sliced.slice(0, args.first);
    }

    if (args.last !== undefined) {
      if (args.last < 0) throw new Error('"last" argument cannot be negative');
      sliced = sliced.slice(Math.max(0, sliced.length - args.last));
    }

    const edges = sliced.map((node) => ({
      cursor: this.getCursor(node),
      node,
    }));

    const hasNextPage =
      args.first !== undefined ? startIndex + (args.first ?? 0) < endIndex : false;
    const hasPreviousPage = args.last !== undefined ? startIndex > 0 : startIndex > 0;

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges.length > 0 ? edges[0].cursor : null,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      },
      totalCount: items.length,
    };
  }
}
