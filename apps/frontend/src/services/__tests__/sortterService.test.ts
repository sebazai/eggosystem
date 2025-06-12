import { fetchTeamValues } from "../sortterService";
import { nextFetcher } from "@/lib/fetcher";

// Mock the nextFetcher
jest.mock("@/lib/fetcher", () => ({
  nextFetcher: jest.fn()
}));

describe("SortterService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchTeamValues", () => {
    it("should fetch team values for a given season", async () => {
      // Mock data
      const mockResponse = [
        {
          team_id: 1,
          team_name: "Team 1",
          top5_values: [350, 345, 340, 335, 330]
        },
        {
          team_id: 2,
          team_name: "Team 2",
          top5_values: [340, 335, 330, 325, 320]
        }
      ];

      // Setup mock
      (nextFetcher as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Call the function
      const result = await fetchTeamValues(5);

      // Assertions
      expect(nextFetcher).toHaveBeenCalledWith("/api/v1/sortter/season/5");
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors properly", async () => {
      // Setup mock to throw error
      (nextFetcher as jest.Mock).mockRejectedValueOnce(new Error("API error"));

      // Call and expect rejection
      await expect(fetchTeamValues(5)).rejects.toThrow("API error");
    });
  });
});
