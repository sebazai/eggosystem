import { checkPlayerAdditionEligibility } from "./season.models";
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

describe("Season Models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockClear();
    mockFetch.mockClear();
  });

  afterEach(async () => {
    // Ensure all pending operations are completed
    await new Promise((resolve) => setTimeout(resolve, 100));
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
          current_top3_avg: 1500,
          current_top4_avg: 1450
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
        "JOIN SeasonTeamPlayers strp"
      );

      // Check the second query (team query)
      expect(mockRunQuery.mock.calls[1][0]).toContain("WITH TeamTopPlayers AS");

      // Check the third query (top teams query)
      expect(mockRunQuery.mock.calls[2][0]).toContain(
        "WITH TeamPlayersKanaElo AS"
      );

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
          current_top3_avg: 1500,
          current_top4_avg: 1450
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
          current_top3_avg: 1500,
          current_top4_avg: 1450
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
