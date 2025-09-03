import { checkPlayerAdditionEligibility } from "./season.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { mswServer, http, HttpResponse } from "@eggosystem/shared-msw";

// Mock the database
jest.mock("../../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("Season Models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockClear();

    // Reset MSW handlers to default behavior
    mswServer.resetHandlers();
  });

  afterEach(async () => {
    // Ensure all pending operations are completed
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe("checkPlayerAdditionEligibility", () => {
    it("should return eligibility analysis for a player with CSRankker data", async () => {
      // Set up MSW handler for this specific test to return kana_elo 1600
      mswServer.use(
        http.get(
          "https://csrankker.kanaliiga.fi/api/v1/kanaelo/:steamId",
          () => {
            return HttpResponse.json({
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
            });
          }
        )
      );

      // Mock league query result (now returns league_id)
      mockRunQuery.mockResolvedValueOnce([
        {
          league_id: 1
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

      // Mock league name query result
      mockRunQuery.mockResolvedValueOnce([
        {
          league_name: "League 1"
        }
      ]);

      const result = await checkPlayerAdditionEligibility(
        1,
        1,
        "76561198028510846"
      );

      // Check that the queries were called with correct parameters
      expect(mockRunQuery).toHaveBeenCalledTimes(4);

      // Check the first query (league_id query)
      expect(mockRunQuery.mock.calls[0][0]).toContain("SELECT slt.league_id");

      // Check the second query (team query)
      expect(mockRunQuery.mock.calls[1][0]).toContain("WITH TeamTopPlayers AS");

      // Check the third query (top teams query)
      expect(mockRunQuery.mock.calls[2][0]).toContain(
        "WITH TeamPlayersKanaElo AS"
      );

      // Check the fourth query (league name query)
      expect(mockRunQuery.mock.calls[3][0]).toContain(
        "SELECT l.name AS league_name"
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
      // Set up MSW handler to return high kana_elo (2000) for this test
      mswServer.use(
        http.get(
          "https://csrankker.kanaliiga.fi/api/v1/kanaelo/:steamId",
          () => {
            return HttpResponse.json({
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
            });
          }
        )
      );

      // Mock league query result (now returns league_id)
      mockRunQuery.mockResolvedValueOnce([
        {
          league_id: 1
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

      // Mock league name query result
      mockRunQuery.mockResolvedValueOnce([
        {
          league_name: "League 1"
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

    it("should handle CSRankker API errors gracefully", async () => {
      // Set up MSW handler to simulate a network error
      mswServer.use(
        http.get(
          "https://csrankker.kanaliiga.fi/api/v1/kanaelo/:steamId",
          () => {
            return HttpResponse.error();
          }
        )
      );

      // Mock league query result (now returns league_id)
      mockRunQuery.mockResolvedValueOnce([
        {
          league_id: 1
        }
      ]);

      await expect(
        checkPlayerAdditionEligibility(1, 1, "123456789")
      ).rejects.toThrow(
        "Failed to fetch stabilized kana_elo from CSRankker: Failed to fetch"
      );
    });

    it("should handle CSRankker API non-success status", async () => {
      // Set up MSW handler to return an error status
      mswServer.use(
        http.get(
          "https://csrankker.kanaliiga.fi/api/v1/kanaelo/:steamId",
          () => {
            return HttpResponse.json(
              {
                status: "error",
                message: "Player not found"
              },
              { status: 400 }
            );
          }
        )
      );

      // Mock league query result (now returns league_id)
      mockRunQuery.mockResolvedValueOnce([
        {
          league_id: 1
        }
      ]);

      await expect(
        checkPlayerAdditionEligibility(1, 1, "123456789")
      ).rejects.toThrow("CSRankker API returned 400: Bad Request");
    });

    it("should throw error if team not found in season", async () => {
      // Set up MSW handler for this test
      mswServer.use(
        http.get(
          "https://csrankker.kanaliiga.fi/api/v1/kanaelo/:steamId",
          () => {
            return HttpResponse.json({
              status: "success",
              result: {
                steamId: "123456789",
                seasonId: 15,
                originalKanaelo: 250,
                stabilizedKanaelo: 240,
                timestamp: "2025-07-15T22:11:17.792Z"
              }
            });
          }
        )
      );

      // Reset mock and set up for this test
      mockRunQuery.mockReset();

      // Return empty array for the league query to trigger the error
      mockRunQuery.mockResolvedValueOnce([]);

      await expect(
        checkPlayerAdditionEligibility(1, 999, "123456789")
      ).rejects.toThrow("Team 999 not found in season 1");
    });

    it("should throw error if team analysis fails", async () => {
      // Set up MSW handler for this test
      mswServer.use(
        http.get(
          "https://csrankker.kanaliiga.fi/api/v1/kanaelo/:steamId",
          () => {
            return HttpResponse.json({
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
            });
          }
        )
      );

      // Reset mock and set up for this test
      mockRunQuery.mockReset();

      // Return data for league query but empty array for selected team query
      mockRunQuery
        .mockResolvedValueOnce([{ league_id: 1 }])
        .mockResolvedValueOnce([]);

      await expect(
        checkPlayerAdditionEligibility(1, 1, "123456789")
      ).rejects.toThrow(
        "Could not analyze team 1 - team may not have enough players in season 1"
      );
    });
  });
});
