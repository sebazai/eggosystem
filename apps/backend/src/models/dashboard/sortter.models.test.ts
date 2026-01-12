import {
  getTeamValuesForSortter,
  getTeamPlayerValuesForSortter
} from "./sortter.models";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock the runQuery function
jest.mock("../../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

// Mock Redis client
jest.mock("../../utils/redisClient", () => ({
  redisClient: {
    keys: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    flushall: jest.fn()
  },
  expireIn30Days: 2592000
}));

describe("Sortter Models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockClear();
  });

  afterEach(async () => {
    // Ensure all pending operations are completed
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe("getTeamValuesForSorter", () => {
    it("should return all teams with their values for a given season", async () => {
      const mockData = [
        {
          team_id: 1,
          team_name: "Test Team",
          team_logo: "logo.png",
          league_name: "Test League",
          top5_sum: 1000,
          avg5: 200,
          orig5: null,
          top5_values: "[100, 200, 300, 400, 500]",
          top5_offered_values: "[null, null, null, null, null]"
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamValuesForSortter(1);

      expect(result).toEqual([
        {
          team_id: 1,
          team_name: "Test Team",
          team_logo: "logo.png",
          league_name: "Test League",
          top5_sum: 1000,
          avg5: 200,
          orig5: null,
          top5_values: [100, 200, 300, 400, 500],
          top5_offered_values: [null, null, null, null, null],
          is_flagged: false
        }
      ]);
    });

    it("should return an empty array if no teams are found", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getTeamValuesForSortter(1);

      expect(result).toEqual([]);
    });

    it("should match expected values for team CSKeisari", async () => {
      const mockData = [
        {
          team_id: 1,
          team_name: "CSKeisari",
          team_logo: "logo.png",
          league_name: "Test League",
          top5_sum: 1000,
          avg5: 200,
          orig5: null,
          top5_values: "[100, 200, 300, 400, 500]",
          top5_offered_values: "[null, null, null, null, null]"
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamValuesForSortter(1);

      expect(result[0].team_name).toBe("CSKeisari");
      expect(result[0].top5_values).toEqual([100, 200, 300, 400, 500]);
    });

    it("should convert team values from raw database format to expected format", async () => {
      const mockData = [
        {
          team_id: 1,
          team_name: "Test Team",
          team_logo: "logo.png",
          league_name: "Test League",
          top5_sum: 1000,
          avg5: 200,
          orig5: null,
          top5_values: "[100, 200, 300, 400, 500]",
          top5_offered_values: "[null, null, null, null, null]"
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamValuesForSortter(1);

      expect(result[0].top5_values).toEqual([100, 200, 300, 400, 500]);
      expect(typeof result[0].top5_values).toBe("object");
      expect(Array.isArray(result[0].top5_values)).toBe(true);
    });

    it("should return team values for the season", async () => {
      // Mock response data
      const mockTeamValues = [
        {
          team_id: 1,
          team_name: "Team 1",
          team_logo: "logo1.png",
          league_name: "League 1",
          top5_sum: 500,
          avg5: 100,
          orig5: null,
          top5_values: "[120, 110, 100, 90, 80]",
          top5_offered_values: "[null, null, null, null, null]"
        }
      ];

      // Set up the mock to return our test data
      mockRunQuery.mockResolvedValueOnce(mockTeamValues);

      // Call the function
      const result = await getTeamValuesForSortter(1);

      // Check that runQuery was called with the correct SQL query
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      expect(mockRunQuery.mock.calls[0][0]).toContain(
        "JOIN SeasonTeamRegistrationPlayers strp"
      );
      expect(mockRunQuery.mock.calls[0][1]).toEqual([1]); // seasonId parameter

      // Check the result
      expect(result).toHaveLength(1);
      expect(result[0].team_id).toBe(1);
      expect(result[0].top5_values).toEqual([120, 110, 100, 90, 80]);
    });
  });

  describe("getTeamPlayerValuesForSortter", () => {
    it("should return player values for a specific team and season", async () => {
      const mockData = [
        {
          name: "Test Player",
          steamid: "123456789",
          cs2_rank: 10,
          faceit_level: 5,
          faceit_elo: 1500,
          hours: 1000,
          kanarating: 1.5,
          fkd: 1.2
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamPlayerValuesForSortter(1, 1);

      expect(result).toEqual(mockData);
    });

    it("should handle null values in the result", async () => {
      const mockData = [
        {
          name: "Test Player",
          steamid: "123456789",
          cs2_rank: null,
          faceit_level: null,
          faceit_elo: null,
          hours: null,
          kanarating: null,
          fkd: null
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamPlayerValuesForSortter(1, 1);

      expect(result).toEqual(mockData);
    });

    it("should return player values for a specific team and season", async () => {
      // Mock response data
      const mockPlayerValues = [
        {
          name: "Player 1",
          steamid: "123456789",
          cs2_rank: 10,
          faceit_level: 5,
          faceit_elo: 1500,
          hours: 2000,
          kanarating: 100,
          fkd: 1.5
        }
      ];

      // Set up the mock to return our test data
      mockRunQuery.mockResolvedValueOnce(mockPlayerValues);

      // Call the function
      const result = await getTeamPlayerValuesForSortter(1, 1);

      // Check that runQuery was called with the correct SQL query
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      expect(mockRunQuery.mock.calls[0][0]).toContain(
        "JOIN SeasonTeamRegistrationPlayers strp"
      );
      expect(mockRunQuery.mock.calls[0][1]).toEqual([1, 1, 1]); // seasonId (for prev stats), seasonId, teamId

      // Check the result
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Player 1");
      expect(result[0].steamid).toBe("123456789");
    });
  });
});
