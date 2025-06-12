import { fetchSeasons } from "../seasonService";
import { nextFetcher } from "@/lib/fetcher";

// Mock the nextFetcher
jest.mock("@/lib/fetcher", () => ({
  nextFetcher: jest.fn()
}));

describe("SeasonService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchSeasons", () => {
    it("should fetch all seasons", async () => {
      // Mock data
      const mockResponse = [
        { id: 1, name: "Season 1" },
        { id: 2, name: "Season 2" },
        { id: 3, name: "Season 3" }
      ];

      // Setup mock
      (nextFetcher as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Call the function
      const result = await fetchSeasons();

      // Assertions
      expect(nextFetcher).toHaveBeenCalledWith("/api/v1/seasons");
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors properly", async () => {
      // Setup mock to throw error
      (nextFetcher as jest.Mock).mockRejectedValueOnce(new Error("API error"));

      // Call and expect rejection
      await expect(fetchSeasons()).rejects.toThrow("API error");
    });
  });
});
