import { fetchAllItemsWithPagination } from "./pagination-utils";

describe("Pagination Utils", () => {
  let mockPaginatedAPI: jest.Mock;

  beforeEach(() => {
    mockPaginatedAPI = jest.fn();
  });

  describe("fetchAllItemsWithPagination", () => {
    it("should fetch all items from a paginated API", async () => {
      // Mock API that returns 3 pages of data
      mockPaginatedAPI
        .mockResolvedValueOnce({ items: ["item1", "item2", "item3"] })
        .mockResolvedValueOnce({ items: ["item4", "item5"] })
        .mockResolvedValueOnce({ items: [] });

      const result = await fetchAllItemsWithPagination(
        mockPaginatedAPI,
        "items",
        3
      );

      expect(result).toEqual(["item1", "item2", "item3", "item4", "item5"]);
      expect(mockPaginatedAPI).toHaveBeenCalledTimes(2); // Should stop after getting 2 items (less than limit 3)
      expect(mockPaginatedAPI).toHaveBeenNthCalledWith(1, 0, 3);
      expect(mockPaginatedAPI).toHaveBeenNthCalledWith(2, 3, 3);
    });

    it("should handle single page of results", async () => {
      mockPaginatedAPI.mockResolvedValueOnce({ items: ["item1", "item2"] });

      const result = await fetchAllItemsWithPagination(
        mockPaginatedAPI,
        "items",
        5
      );

      expect(result).toEqual(["item1", "item2"]);
      expect(mockPaginatedAPI).toHaveBeenCalledTimes(1);
      expect(mockPaginatedAPI).toHaveBeenCalledWith(0, 5);
    });

    it("should handle empty results", async () => {
      mockPaginatedAPI.mockResolvedValueOnce({ items: [] });

      const result = await fetchAllItemsWithPagination(
        mockPaginatedAPI,
        "items",
        10
      );

      expect(result).toEqual([]);
      expect(mockPaginatedAPI).toHaveBeenCalledTimes(1);
      expect(mockPaginatedAPI).toHaveBeenCalledWith(0, 10);
    });

    it("should work with custom items key", async () => {
      mockPaginatedAPI.mockResolvedValueOnce({ results: ["item1", "item2"] });

      const result = await fetchAllItemsWithPagination(
        mockPaginatedAPI,
        "results",
        10
      );

      expect(result).toEqual(["item1", "item2"]);
      expect(mockPaginatedAPI).toHaveBeenCalledTimes(1);
      expect(mockPaginatedAPI).toHaveBeenCalledWith(0, 10);
    });

    it("should start from custom offset", async () => {
      // Mock API that starts from offset 20
      mockPaginatedAPI
        .mockResolvedValueOnce({ items: ["item21", "item22", "item23"] })
        .mockResolvedValueOnce({ items: ["item24", "item25"] });

      const result = await fetchAllItemsWithPagination(
        mockPaginatedAPI,
        "items",
        3,
        20 // Start from offset 20
      );

      expect(result).toEqual([
        "item21",
        "item22",
        "item23",
        "item24",
        "item25"
      ]);
      expect(mockPaginatedAPI).toHaveBeenCalledTimes(2);
      expect(mockPaginatedAPI).toHaveBeenNthCalledWith(1, 20, 3); // Start from offset 20
      expect(mockPaginatedAPI).toHaveBeenNthCalledWith(2, 23, 3); // Next call at offset 23
    });
  });
});
