import type { AxiosResponse } from "axios";
import type { Paginated } from "@/types";

/**
 * Both /expenses and /income cap `limit` at 100 server-side, so a month (or
 * especially a year) of transactions can span multiple pages. This walks
 * every page for a given query and returns the flattened result.
 *
 * `maxPages` is a hard safety cap so a runaway loop can never hang the UI,
 * even if `pagination.pages` were ever wrong.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<AxiosResponse<{ success: boolean } & Paginated<T>>>,
  { limit = 100, maxPages = 100 }: { limit?: number; maxPages?: number } = {}
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { data } = await fetchPage(page, limit);
    results.push(...data.data);
    totalPages = data.pagination.pages || 1;
    page += 1;
  } while (page <= totalPages && page <= maxPages);

  return results;
}
