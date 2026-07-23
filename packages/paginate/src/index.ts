export interface PaginateOptions<T, P> {
  /** Function to fetch a single page of data */
  fetchPage: (params: P) => Promise<T[]>;
  /**
   * Function to determine the parameters for the next page.
   * Return null if there are no more pages.
   */
  getNextPageParams: (lastPage: T[], currentParams: P) => P | null;
  /** The parameters to fetch the first page */
  initialParams: P;
  /** Maximum number of pages to fetch (default: Infinity) to prevent infinite loops */
  maxPages?: number;
}

/**
 * Automatically fetches all pages of data from a paginated API.
 *
 * @param options Pagination configuration
 * @returns An array containing all items from all pages combined.
 */
export async function fetchAllPages<T, P>(options: PaginateOptions<T, P>): Promise<T[]> {
  const allResults: T[] = [];
  let currentParams: P | null = options.initialParams;
  let pagesFetched = 0;
  const maxPages = options.maxPages ?? Infinity;

  while (currentParams !== null && pagesFetched < maxPages) {
    const pageResults = await options.fetchPage(currentParams);

    // Safety check: if no results are returned, assume pagination is finished
    if (pageResults.length === 0) {
      break;
    }

    allResults.push(...pageResults);
    pagesFetched++;

    // Calculate parameters for the next fetch
    currentParams = options.getNextPageParams(pageResults, currentParams);
  }

  return allResults;
}
