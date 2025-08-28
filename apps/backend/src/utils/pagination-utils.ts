/**
 * Utility function to fetch all items from a paginated API endpoint
 * by automatically handling offset pagination until all items are retrieved.
 *
 * @param fetchFunction - Function that fetches data with offset and limit parameters
 * @param itemsKey - Key in the response object that contains the items array (default: "items")
 * @param limit - Number of items to fetch per request (default: 100)
 * @param startOffset - Starting offset for pagination (default: 0)
 * @returns Promise with all items combined
 */
export async function fetchAllItemsWithPagination<T, R>(
  fetchFunction: (offset: number, limit: number) => Promise<T>,
  itemsKey: string = "items",
  limit: number = 100,
  startOffset: number = 0
): Promise<R[]> {
  const allItems: R[] = [];
  let offset = startOffset;
  let hasMoreItems = true;

  while (hasMoreItems) {
    try {
      const response = await fetchFunction(offset, limit);

      // Extract items from the response using the specified key
      const items = (response as Record<string, R[]>)[itemsKey] || [];

      if (items.length === 0) {
        // No more items to fetch
        hasMoreItems = false;
        break;
      }

      // Add items to our collection
      allItems.push(...items);

      // If we got fewer items than the limit, we've reached the end
      if (items.length < limit) {
        hasMoreItems = false;
        break;
      }

      // Move to next page
      offset += limit;
    } catch (error) {
      console.error(`Error fetching items at offset ${offset}:`, error);
      throw error;
    }
  }

  return allItems;
}
