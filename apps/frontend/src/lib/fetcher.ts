import { expressFetcher } from "./utils";

/**
 * Fetcher function for Next.js client components to use with API endpoints
 * @param url The API endpoint URL
 * @param options Optional fetch options
 * @returns The parsed JSON response
 */
export async function nextFetcher<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  return expressFetcher<T>(url, options);
}
