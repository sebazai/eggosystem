import {
  getTeamValuesForSorter,
  getTeamPlayerValuesForSortter,
  getTeamsForSeason,
  checkPlayerAdditionEligibility
} from "./sortter.models";
import { runQuery } from "../db/mysqlRunQuery";

// Mock the runQuery function
jest.mock("../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

// Mock Redis client
jest.mock("../utils/redisClient", () => ({
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

// Mock fetch for CSRankker API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper function to create a proper mock response
const createMockResponse = (data: unknown, ok: boolean = true) => ({
  ok,
  json: async () => data,
  clone: function () {
    return this;
  },
  status: ok ? 200 : 400,
  statusText: ok ? "OK" : "Bad Request"
});

describe("Sortter Models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockClear();
    mockFetch.mockClear();
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
          avg4: 250,
          orig4: null,
          top5_values: "[100, 200, 300, 400, 500]",
          top5_offered_values: "[null, null, null, null, null]"
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamValuesForSorter(1);

      expect(result).toEqual([
        {
          team_id: 1,
          team_name: "Test Team",
          team_logo: "logo.png",
          league_name: "Test League",
          top5_sum: 1000,
          avg4: 250,
          orig4: null,
          top5_values: [100, 200, 300, 400, 500],
          top5_offered_values: [null, null, null, null, null],
          is_flagged: false
        }
      ]);
    });

    it("should return an empty array if no teams are found", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getTeamValuesForSorter(1);

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
          avg4: 250,
          orig4: null,
          top5_values: "[100, 200, 300, 400, 500]",
          top5_offered_values: "[null, null, null, null, null]"
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamValuesForSorter(1);

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
          avg4: 250,
          orig4: null,
          top5_values: "[100, 200, 300, 400, 500]",
          top5_offered_values: "[null, null, null, null, null]"
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamValuesForSorter(1);

      expect(result[0].top5_values).toEqual([100, 200, 300, 400, 500]);
      expect(typeof result[0].top5_values).toBe("object");
      expect(Array.isArray(result[0].top5_values)).toBe(true);
    });

    it("should return team values with approved=true filter", async () => {
      // Mock response data
      const mockTeamValues = [
        {
          team_id: 1,
          team_name: "Team 1",
          team_logo: "logo1.png",
          league_name: "League 1",
          top5_sum: 500,
          avg4: 100,
          orig4: null,
          top5_values: "[120, 110, 100, 90, 80]",
          top5_offered_values: "[null, null, null, null, null]"
        }
      ];

      // Set up the mock to return our test data
      mockRunQuery.mockResolvedValueOnce(mockTeamValues);

      // Call the function
      const result = await getTeamValuesForSorter(1);

      // Check that runQuery was called with the correct SQL query
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      expect(mockRunQuery.mock.calls[0][0]).toContain(
        "JOIN SeasonTeamRegistrations str"
      );
      expect(mockRunQuery.mock.calls[0][0]).toContain("AND str.approved = 1");
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

    it("should return player values with approved=true filter", async () => {
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
        "JOIN SeasonTeamRegistrations str"
      );
      expect(mockRunQuery.mock.calls[0][0]).toContain("AND str.approved = 1");
      expect(mockRunQuery.mock.calls[0][1]).toEqual([1, 1]); // seasonId and teamId parameters

      // Check the result
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Player 1");
      expect(result[0].steamid).toBe("123456789");
    });
  });

  describe("getTeamsForSeason", () => {
    it("should return teams for a specific season", async () => {
      const mockData = [
        {
          team_id: 1,
          team_name: "Test Team 1",
          league_name: "Test League"
        },
        {
          team_id: 2,
          team_name: "Test Team 2",
          league_name: "Test League"
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamsForSeason(1);

      expect(result).toEqual(mockData);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT DISTINCT"),
        [1]
      );
    });

    it("should return empty array if no teams found", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getTeamsForSeason(1);

      expect(result).toEqual([]);
    });

    it("should return teams with approved=true filter", async () => {
      // Mock response data
      const mockTeams = [
        {
          team_id: 1,
          team_name: "Team 1",
          league_name: "League 1"
        },
        {
          team_id: 2,
          team_name: "Team 2",
          league_name: "League 2"
        }
      ];

      // Set up the mock to return our test data
      mockRunQuery.mockResolvedValueOnce(mockTeams);

      // Call the function
      const result = await getTeamsForSeason(1);

      // Check that runQuery was called with the correct SQL query
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      expect(mockRunQuery.mock.calls[0][0]).toContain(
        "JOIN SeasonTeamRegistrations str"
      );
      expect(mockRunQuery.mock.calls[0][0]).toContain("AND str.approved = 1");
      expect(mockRunQuery.mock.calls[0][1]).toEqual([1]); // seasonId parameter

      // Check the result
      expect(result).toHaveLength(2);
      expect(result[0].team_id).toBe(1);
      expect(result[1].team_id).toBe(2);
    });
  });

  describe("checkPlayerAdditionEligibility", () => {
    beforeEach(() => {
      // Mock fetch for CSRankker API
      mockFetch.mockImplementation(() =>
        Promise.resolve(
          createMockResponse({
            status: "success",
            result: {
              steamId: "76561198028510846",
              seasonId: 14,
              originalKanaelo: 1500,
              stabilizedKanaelo: 1600,
              stabilizationInfo: {
                confidence: 0.8,
                adjustmentFactor: 0.1,
                method: "bayesian"
              },
              components: {
                trueLevel: 1200,
                mm: 100,
                hour: 200,
                kana: 100
              },
              calculus: "formula",
              timestamp: "2023-01-01T00:00:00Z"
            }
          })
        )
      );
    });

    it("should return eligibility analysis for a player with CSRankker data", async () => {
      // Mock league query result
      mockRunQuery.mockResolvedValueOnce([
        {
          league_name: "League 1"
        }
      ]);

      // Mock team query result
      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 1,
          team_name: "Team 1",
          current_top3_avg: 1500
        }
      ]);

      // Mock top teams query result
      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 2,
          team_name: "Top Team",
          avg4: 1800,
          rank: 1
        }
      ]);

      const result = await checkPlayerAdditionEligibility(
        1,
        1,
        "76561198028510846"
      );

      // Check that the queries were called with correct parameters
      expect(mockRunQuery).toHaveBeenCalledTimes(3);

      // Check the first query (league query)
      expect(mockRunQuery.mock.calls[0][0]).toContain(
        "JOIN SeasonTeamRegistrations str"
      );
      expect(mockRunQuery.mock.calls[0][0]).toContain("AND str.approved = 1");

      // Check the second query (team query)
      expect(mockRunQuery.mock.calls[1][0]).toContain(
        "JOIN SeasonTeamRegistrations str"
      );
      expect(mockRunQuery.mock.calls[1][0]).toContain("AND str.approved = 1");

      // Check the third query (top teams query)
      expect(mockRunQuery.mock.calls[2][0]).toContain(
        "JOIN SeasonTeamRegistrations str"
      );
      expect(mockRunQuery.mock.calls[2][0]).toContain("AND str.approved = 1");

      // Check the result structure
      expect(result).toHaveProperty("selectedTeam");
      expect(result).toHaveProperty("topTeamsInLeague");
      expect(result).toHaveProperty("canAddPlayer");
      expect(result).toHaveProperty("league_name");

      // Check specific values
      expect(result.selectedTeam.new_player_kana_elo).toBe(1600);
      expect(result.canAddPlayer).toBe(true);
    });

    it("should return false for canAddPlayer when new average is higher than top team", async () => {
      // Mock league query result
      mockRunQuery.mockResolvedValueOnce([
        {
          league_name: "League 1"
        }
      ]);

      // Mock team query result
      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 2053,
          team_name: "Team X",
          current_top3_avg: 1500
        }
      ]);

      // Mock top teams query result
      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 1,
          team_name: "Top Team",
          avg4: 1500,
          rank: 1
        }
      ]);

      const result = await checkPlayerAdditionEligibility(
        14,
        2053,
        "76561198028510846"
      );

      expect(result.canAddPlayer).toBe(false);
    });

    it("should handle CSRankker API errors gracefully", async () => {
      // Mock fetch to reject with an error
      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error("Network error"))
      );

      // Mock league query result
      mockRunQuery.mockResolvedValueOnce([
        {
          league_name: "Test League"
        }
      ]);

      await expect(
        checkPlayerAdditionEligibility(1, 1, "123456789")
      ).rejects.toThrow(
        "Failed to fetch stabilized kana_elo from CSRankker: Network error"
      );
    });

    it("should handle CSRankker API non-success status", async () => {
      // Mock fetch to return a non-success status
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(
          createMockResponse({
            status: "error",
            message: "Player not found"
          })
        )
      );

      // Mock league query result
      mockRunQuery.mockResolvedValueOnce([
        {
          league_name: "Test League"
        }
      ]);

      await expect(
        checkPlayerAdditionEligibility(1, 1, "123456789")
      ).rejects.toThrow("CSRankker API returned unsuccessful status");
    });

    it("should return false for canAddPlayer when new average is higher than top team", async () => {
      // Reset fetch mock to return successful response with high kana_elo
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(
          createMockResponse({
            status: "success",
            result: {
              steamId: "76561198028510846",
              seasonId: 14,
              originalKanaelo: 2000,
              stabilizedKanaelo: 2000,
              stabilizationInfo: {
                confidence: 0.8,
                adjustmentFactor: 0.1,
                method: "bayesian"
              },
              components: {
                trueLevel: 1200,
                mm: 100,
                hour: 200,
                kana: 100
              },
              calculus: "formula",
              timestamp: "2023-01-01T00:00:00Z"
            }
          })
        )
      );

      // Mock league query result
      mockRunQuery.mockResolvedValueOnce([
        {
          league_name: "League 1"
        }
      ]);

      // Mock team query result
      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 2053,
          team_name: "Team X",
          current_top3_avg: 1500
        }
      ]);

      // Mock top teams query result
      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 1,
          team_name: "Top Team",
          avg4: 1500,
          rank: 1
        }
      ]);

      const result = await checkPlayerAdditionEligibility(
        14,
        2053,
        "76561198028510846"
      );

      // With a high kana_elo player (2000) added to a team with avg 1500,
      // the new average should be higher than the top team's avg4 of 1500
      expect(result.canAddPlayer).toBe(false);
    });

    it("should throw error if team not found in season", async () => {
      // Reset mock and set up for this test
      mockRunQuery.mockReset();
      mockFetch.mockReset();

      // Return empty array for the league query to trigger the error
      mockRunQuery.mockResolvedValueOnce([]);

      // Mock CSRankker API response
      const mockCSRankkerResponse = {
        status: "success",
        result: {
          steamId: "123456789",
          seasonId: 15,
          originalKanaelo: 250,
          stabilizedKanaelo: 240,
          timestamp: "2025-07-15T22:11:17.792Z"
        }
      };

      // Mock the API call for stabilized kana_elo
      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockCSRankkerResponse, true)
      );

      await expect(
        checkPlayerAdditionEligibility(1, 999, "123456789")
      ).rejects.toThrow("Team 999 not found in season 1");
    });

    it("should throw error if team analysis fails", async () => {
      // Reset mock and set up for this test
      mockRunQuery.mockReset();
      mockFetch.mockReset();

      // Mock CSRankker API response
      const mockCSRankkerResponse = {
        status: "success",
        result: {
          steamId: "123456789",
          seasonId: 15,
          originalKanaelo: 250,
          stabilizedKanaelo: 240,
          stabilizationInfo: {
            confidence: 0.8,
            adjustmentFactor: 0.96,
            method: "kanarating-stabilization"
          },
          components: {
            trueLevel: 100,
            mm: 80,
            hour: 20,
            kana: 40
          },
          calculus: "100 + 80 + 20 + 40",
          timestamp: "2025-07-15T22:11:17.792Z"
        }
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(mockCSRankkerResponse, true)
      );

      // Return data for league query but empty array for selected team query
      mockRunQuery
        .mockResolvedValueOnce([{ league_name: "Test League" }])
        .mockResolvedValueOnce([]);

      await expect(
        checkPlayerAdditionEligibility(1, 1, "123456789")
      ).rejects.toThrow(
        "Could not analyze team 1 - team may not have enough players in season 1"
      );
    });
  });
});
