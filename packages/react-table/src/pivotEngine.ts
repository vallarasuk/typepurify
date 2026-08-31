// @typepurify/react-table - Pivot Engine
export function createPivotEngine<T extends Record<string, any>>(data: T[], pivotBy: keyof T) {
  const groups = new Map<any, T[]>();

  for (const item of data) {
    const key = item[pivotBy];
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  return {
    getGroups: () => Array.from(groups.entries()).map(([key, rows]) => ({ key, rows })),
    aggregateCount: () =>
      Array.from(groups.entries()).map(([key, rows]) => ({ key, count: rows.length })),
  };
}
