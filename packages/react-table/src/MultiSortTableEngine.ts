import { clean } from 'typepurify';

export type SortDirection = 'asc' | 'desc';

export interface SortRule<T> {
  key: keyof T | ((row: T) => any);
  direction?: SortDirection;
  nulls?: 'first' | 'last';
}

/**
 * MultiSortTableEngine performs stable, multi-column hierarchical sorting for data tables.
 */
export class MultiSortTableEngine {
  static sortRows<T extends Record<string, any>>(rows: T[], rules: SortRule<T>[]): T[] {
    const cleanedRows = rows.map((r) => clean(r) as T);

    return [...cleanedRows].sort((a, b) => {
      for (const rule of rules) {
        const dir = rule.direction ?? 'asc';
        const nulls = rule.nulls ?? 'last';

        const valA = typeof rule.key === 'function' ? rule.key(a) : a[rule.key];
        const valB = typeof rule.key === 'function' ? rule.key(b) : b[rule.key];

        if (valA === valB) continue;

        if (valA === undefined || valA === null) {
          return nulls === 'first' ? -1 : 1;
        }
        if (valB === undefined || valB === null) {
          return nulls === 'first' ? 1 : -1;
        }

        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else if (valA instanceof Date && valB instanceof Date) {
          comparison = valA.getTime() - valB.getTime();
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }

        if (comparison !== 0) {
          return dir === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }
}
