import { describe, it, expect, vi } from 'vitest';
import { fetchAllPages } from './index';

describe('@typepurify/paginate', () => {
  it('should fetch all pages until getNextPageParams returns null', async () => {
    const fetchPage = vi.fn().mockImplementation(async (page: number) => {
      if (page === 1) return [1, 2];
      if (page === 2) return [3, 4];
      return [];
    });

    const getNextPageParams = vi.fn().mockImplementation((lastPage, currentPage) => {
      return currentPage < 2 ? currentPage + 1 : null;
    });

    const results = await fetchAllPages({
      initialParams: 1,
      fetchPage,
      getNextPageParams,
    });

    expect(results).toEqual([1, 2, 3, 4]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(getNextPageParams).toHaveBeenCalledTimes(2);
  });

  it('should stop fetching if an empty array is returned (safety check)', async () => {
    const fetchPage = vi.fn().mockImplementation(async (page: number) => {
      if (page === 1) return [1, 2];
      return []; // Return empty on page 2
    });

    // Buggy implementation that always asks for the next page
    const getNextPageParams = (lastPage: any[], currentPage: number) => currentPage + 1;

    const results = await fetchAllPages({
      initialParams: 1,
      fetchPage,
      getNextPageParams,
    });

    expect(results).toEqual([1, 2]);
    expect(fetchPage).toHaveBeenCalledTimes(2); // 1 for data, 1 for empty array
  });

  it('should respect the maxPages limit', async () => {
    const fetchPage = vi.fn().mockImplementation(async (page: number) => {
      return [page];
    });

    const getNextPageParams = (lastPage: any[], currentPage: number) => currentPage + 1;

    const results = await fetchAllPages({
      initialParams: 1,
      fetchPage,
      getNextPageParams,
      maxPages: 3,
    });

    expect(results).toEqual([1, 2, 3]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });
});
