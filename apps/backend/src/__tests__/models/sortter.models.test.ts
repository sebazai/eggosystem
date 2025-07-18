import {
  getTeamValuesForSorter,
  getTeamPlayerValuesForSortter,
  getTeamsForSeason,
  checkPlayerAdditionEligibility
} from "../../models/sortter.models";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock the runQuery function
jest.mock("../../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

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
          top5_values: "[100, 200, 300, 400, 500]"
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
          top5_values: [100, 200, 300, 400, 500]
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
          top5_values: "[100, 200, 300, 400, 500]"
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
          top5_values: "[100, 200, 300, 400, 500]"
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamValuesForSorter(1);

      expect(result[0].top5_values).toEqual([100, 200, 300, 400, 500]);
      expect(typeof result[0].top5_values).toBe("object");
      expect(Array.isArray(result[0].top5_values)).toBe(true);
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
  });

  describe("checkPlayerAdditionEligibility", () => {
    it("should return eligibility analysis for a player with CSRankker data", async () => {
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

      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockCSRankkerResponse))
        .mockResolvedValueOnce(createMockResponse(mockCSRankkerResponse));

      // Mock the league query
      mockRunQuery
        .mockResolvedValueOnce([{ league_name: "Test League" }]) // League query
        .mockResolvedValueOnce([
          {
            // Selected team query
            team_id: 1,
            team_name: "Test Team",
            current_top3_avg: 250
          }
        ])
        .mockResolvedValueOnce([
          // Top teams query
          {
            team_id: 2,
            team_name: "Top Team 1",
            avg4: 300,
            rank: 1
          },
          {
            team_id: 3,
            team_name: "Top Team 2",
            avg4: 280,
            rank: 2
          }
        ]);

      const result = await checkPlayerAdditionEligibility(1, 1, "123456789");

      expect(result).toEqual({
        selectedTeam: {
          team_id: 1,
          team_name: "Test Team",
          current_top3_avg: 250,
          new_player_kana_elo: 240,
          new_avg_with_player: 247.5,
          csrankker_components: {
            trueLevel: 100,
            mm: 80,
            hour: 20,
            kana: 40
          }
        },
        topTeamsInLeague: [
          {
            team_id: 2,
            team_name: "Top Team 1",
            avg4: 300,
            rank: 1
          },
          {
            team_id: 3,
            team_name: "Top Team 2",
            avg4: 280,
            rank: 2
          }
        ],
        canAddPlayer: true,
        league_name: "Test League"
      });

      // Verify CSRankker API was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://csrankker.kanaliiga.fi/api/v1/kanaelo/123456789"
        })
      );
    });

    it("should handle CSRankker API errors gracefully", async () => {
      // Mock CSRankker API error
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Mock the league query
      mockRunQuery
        .mockResolvedValueOnce([{ league_name: "Test League" }])
        .mockResolvedValueOnce([
          {
            team_id: 1,
            team_name: "Test Team",
            current_top3_avg: 250
          }
        ])
        .mockResolvedValueOnce([]);

      await expect(
        checkPlayerAdditionEligibility(1, 1, "123456789")
      ).rejects.toThrow(
        "Failed to fetch stabilized kana_elo from CSRankker: Network error"
      );
    });

    it("should handle CSRankker API non-success status", async () => {
      // Mock CSRankker API non-success response
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ status: "error", message: "Player not found" })
      );

      // Mock the league query
      mockRunQuery
        .mockResolvedValueOnce([{ league_name: "Test League" }])
        .mockResolvedValueOnce([
          {
            team_id: 1,
            team_name: "Test Team",
            current_top3_avg: 250
          }
        ])
        .mockResolvedValueOnce([]);

      await expect(
        checkPlayerAdditionEligibility(1, 1, "123456789")
      ).rejects.toThrow("CSRankker API returned unsuccessful status");
    });

    it("should return false for canAddPlayer when new average is higher than top team", async () => {
      // Reset all mocks to ensure clean state
      mockRunQuery.mockReset();
      mockFetch.mockReset();

      // Mock CSRankker API response with a very high kana_elo value
      const mockCSRankkerResponse = {
        status: "success",
        result: {
          steamId: "123456789",
          seasonId: 15,
          originalKanaelo: 400,
          stabilizedKanaelo: 400, // Very high value that should make new average exceed top team
          stabilizationInfo: {
            confidence: 0.8,
            adjustmentFactor: 1.0,
            method: "kanarating-stabilization"
          },
          components: {
            trueLevel: 150,
            mm: 120,
            hour: 30,
            kana: 100
          },
          calculus: "150 + 120 + 30 + 100",
          timestamp: "2025-07-15T22:11:17.792Z"
        }
      };

      // Mock the fetch calls for CSRankker API
      mockFetch.mockResolvedValue(
        createMockResponse(mockCSRankkerResponse, true)
      );

      // Mock database queries with real data from the API responses
      mockRunQuery.mockImplementation((query, _params) => {
        // Check the query to determine what to return
        if (query.includes("SELECT l.name AS league_name")) {
          // League query
          return Promise.resolve([{ league_name: "Masters" }]);
        } else if (query.includes("WITH TeamTop3Players AS")) {
          // Selected team query
          return Promise.resolve([
            {
              team_id: 2053,
              team_name: "CSKeisari",
              current_top3_avg: 296 // Average of top 3 players (320, 298, 270)
            }
          ]);
        } else if (query.includes("WITH TeamPlayersKanaElo AS")) {
          // Top teams query
          return Promise.resolve([
            {
              team_id: 2053,
              team_name: "CSKeisari",
              avg4: 288.75, // From real data
              rank: 1
            },
            {
              team_id: 1028,
              team_name: "Digia Vengers",
              avg4: 287.5, // From real data
              rank: 2
            },
            {
              team_id: 756,
              team_name: "Elisa Hosujat",
              avg4: 279.75, // From real data
              rank: 3
            }
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await checkPlayerAdditionEligibility(
        14,
        2053,
        "123456789"
      );

      // Calculate expected new average: (296 * 3 + 400) / 4 = 322
      const expectedNewAvg = (296 * 3 + 400) / 4;

      // Verify the results
      expect(result.selectedTeam.new_player_kana_elo).toBe(400);
      expect(result.selectedTeam.new_avg_with_player).toBeCloseTo(
        expectedNewAvg
      );
      expect(result.topTeamsInLeague[0].avg4).toBe(288.75);

      // The new average (322) is greater than the top team's avg4 (288.75)
      // So canAddPlayer should correctly be false
      expect(result.selectedTeam.new_avg_with_player).toBeGreaterThan(
        result.topTeamsInLeague[0].avg4
      );
      expect(result.canAddPlayer).toBe(false);
    }, 10000); // Increase timeout for database query

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
          stabilizedKanaElo: 240,
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
