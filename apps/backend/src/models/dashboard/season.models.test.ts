import { checkPlayerAdditionEligibility } from "./season.models";
import { runQuery } from "../../db/mysqlRunQuery";
import {
  mswServer,
  csrankkerHighKanaEloSteamId,
  csrankkerMediumKanaEloSteamId,
  csrankkerLowKanaEloSteamId,
  csrankkerNetworkErrorSteamId,
  csrankkerNotFoundSteamId
} from "@eggosystem/shared-msw";

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
      // Uses csrankkerMediumKanaEloSteamId which returns stabilizedKanaelo: 1600

      mockRunQuery.mockResolvedValueOnce([
        {
          league_id: 1
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        { steam_id: "76561198000000001" },
        { steam_id: "76561198000000002" }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          id: 1,
          max_players: 9
        }
      ]);

      // Mock for getActiveMapPoolBySeasonId (called by getSeasonById)
      mockRunQuery.mockResolvedValueOnce([
        { map_id: 1 },
        { map_id: 2 },
        { map_id: 3 }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 1,
          team_name: "Team 1",
          current_top4_avg: 1450,
          current_top5_avg: 1500
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 2,
          team_name: "Top Team",
          avg5: 1800,
          rank: 1
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          league_name: "League 1"
        }
      ]);

      const result = await checkPlayerAdditionEligibility(
        1,
        1,
        csrankkerMediumKanaEloSteamId
      );

      expect(mockRunQuery).toHaveBeenCalledTimes(7);

      expect(mockRunQuery.mock.calls[0][0]).toContain("SELECT slt.league_id");
      expect(mockRunQuery.mock.calls[1][0]).toContain(
        "SELECT steam_id FROM SeasonTeamPlayers"
      );
      expect(mockRunQuery.mock.calls[2][0]).toContain(
        "INNER JOIN SeasonSignupSettings"
      );
      expect(mockRunQuery.mock.calls[3][0]).toContain("SELECT map_id");
      expect(mockRunQuery.mock.calls[4][0]).toContain(
        "WITH FilteredPlayers AS"
      );
      expect(mockRunQuery.mock.calls[5][0]).toContain(
        "WITH TeamPlayersKanaElo AS"
      );
      expect(mockRunQuery.mock.calls[6][0]).toContain(
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
      // Uses csrankkerHighKanaEloSteamId which returns stabilizedKanaelo: 2000

      // 1. getPrimaryPlayersForTeam query
      mockRunQuery.mockResolvedValueOnce([
        { steam_id: "76561198000000001" },
        { steam_id: "76561198000000002" }
      ]);
      // 2. getSeasonById query
      mockRunQuery.mockResolvedValueOnce([
        {
          id: 14,
          max_players: 9
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          league_id: 1
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        { steam_id: "76561198000000001" },
        { steam_id: "76561198000000002" }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          id: 14,
          max_players: 9
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 2053,
          team_name: "Team X",
          current_top4_avg: 1450,
          current_top5_avg: 1500
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 1,
          team_name: "Top Team",
          avg5: 1500,
          rank: 1
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          league_name: "League 1"
        }
      ]);

      const result = await checkPlayerAdditionEligibility(
        14,
        2053,
        csrankkerHighKanaEloSteamId
      );

      // With a high kana_elo player (2000) added to a team with avg 1500,
      // the new average should be higher than the top team's avg4 of 1500
      expect(result.canAddPlayer).toBe(false);
    });

    it("should handle CSRankker API errors gracefully", async () => {
      // Uses csrankkerNetworkErrorSteamId which returns a network error

      // 1. getPrimaryPlayersForTeam query
      mockRunQuery.mockResolvedValueOnce([{ steam_id: "76561198000000001" }]);
      // 2. getSeasonById query
      mockRunQuery.mockResolvedValueOnce([
        {
          id: 1,
          max_players: 9
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          league_id: 1
        }
      ]);

      await expect(
        checkPlayerAdditionEligibility(1, 1, csrankkerNetworkErrorSteamId)
      ).rejects.toThrow(
        "Failed to fetch stabilized kana_elo from CSRankker: Failed to fetch"
      );
    });

    it("should handle CSRankker API non-success status", async () => {
      // Uses csrankkerNotFoundSteamId which returns 404

      // 1. getPrimaryPlayersForTeam query
      mockRunQuery.mockResolvedValueOnce([{ steam_id: "76561198000000001" }]);
      // 2. getSeasonById query
      mockRunQuery.mockResolvedValueOnce([
        {
          id: 1,
          max_players: 9
        }
      ]);

      // Mock for getActiveMapPoolBySeasonId (called by getSeasonById)
      mockRunQuery.mockResolvedValueOnce([
        { map_id: 1 },
        { map_id: 2 },
        { map_id: 3 }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          league_id: 1
        }
      ]);

      await expect(
        checkPlayerAdditionEligibility(1, 1, csrankkerNotFoundSteamId)
      ).rejects.toThrow("CSRankker API returned 404: Not Found");
    });

    it("should throw error if team not found in season", async () => {
      // Uses csrankkerLowKanaEloSteamId which returns stabilizedKanaelo: 240

      // Reset mock and set up for this test
      mockRunQuery.mockReset();

      // Return empty array for the league query to trigger the error
      mockRunQuery.mockResolvedValueOnce([]);

      await expect(
        checkPlayerAdditionEligibility(1, 999, csrankkerLowKanaEloSteamId)
      ).rejects.toThrow("Team 999 not found in season 1");
    });

    it("should throw error if team analysis fails", async () => {
      // Uses csrankkerLowKanaEloSteamId which returns stabilizedKanaelo: 240

      // Reset mock and set up for this test
      mockRunQuery.mockReset();

      // 1. getPrimaryPlayersForTeam query
      mockRunQuery.mockResolvedValueOnce([{ steam_id: "76561198000000001" }]);
      // 2. getSeasonById query
      mockRunQuery.mockResolvedValueOnce([
        {
          id: 1,
          max_players: 9
        }
      ]);

      // Mock for getActiveMapPoolBySeasonId (called by getSeasonById)
      mockRunQuery.mockResolvedValueOnce([
        { map_id: 1 },
        { map_id: 2 },
        { map_id: 3 }
      ]);

      // Return data for league query but empty array for selected team query
      mockRunQuery
        .mockResolvedValueOnce([{ league_id: 1 }])
        .mockResolvedValueOnce([]);

      await expect(
        checkPlayerAdditionEligibility(1, 1, csrankkerLowKanaEloSteamId)
      ).rejects.toThrow(
        "Could not analyze team 1 - team may not have enough players in season 1"
      );
    });

    it("should exclude discarded players from selected team eligibility calculation", async () => {
      // Uses csrankkerMediumKanaEloSteamId which returns stabilizedKanaelo: 1600

      mockRunQuery.mockResolvedValueOnce([
        {
          league_id: 1
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        { steam_id: "76561198000000001" },
        { steam_id: "76561198000000002" }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          id: 1,
          max_players: 9
        }
      ]);

      // Mock for getActiveMapPoolBySeasonId (called by getSeasonById)
      mockRunQuery.mockResolvedValueOnce([
        { map_id: 1 },
        { map_id: 2 },
        { map_id: 3 }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 1,
          team_name: "Team 1",
          current_top4_avg: 1450,
          current_top5_avg: 1500
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 2,
          team_name: "Top Team",
          avg5: 1800,
          rank: 1
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          league_name: "League 1"
        }
      ]);

      await checkPlayerAdditionEligibility(1, 1, csrankkerMediumKanaEloSteamId);

      // Verify the selected team query includes discarded_at IS NULL
      const selectedTeamQueryCall = mockRunQuery.mock.calls.find((call) =>
        call[0].includes("WITH FilteredPlayers AS")
      );
      expect(selectedTeamQueryCall).toBeDefined();
      expect(selectedTeamQueryCall?.[0]).toContain("discarded_at IS NULL");
    });

    it("should exclude discarded players from top teams eligibility calculation", async () => {
      // Uses csrankkerMediumKanaEloSteamId which returns stabilizedKanaelo: 1600

      mockRunQuery.mockResolvedValueOnce([
        {
          league_id: 1
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        { steam_id: "76561198000000001" },
        { steam_id: "76561198000000002" }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          id: 1,
          max_players: 9
        }
      ]);

      // Mock for getActiveMapPoolBySeasonId (called by getSeasonById)
      mockRunQuery.mockResolvedValueOnce([
        { map_id: 1 },
        { map_id: 2 },
        { map_id: 3 }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 1,
          team_name: "Team 1",
          current_top4_avg: 1450,
          current_top5_avg: 1500
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 2,
          team_name: "Top Team",
          avg5: 1800,
          rank: 1
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          league_name: "League 1"
        }
      ]);

      await checkPlayerAdditionEligibility(1, 1, csrankkerMediumKanaEloSteamId);

      // Verify the top teams query includes discarded_at IS NULL
      const topTeamsQueryCall = mockRunQuery.mock.calls.find((call) =>
        call[0].includes("WITH TeamPlayersKanaElo AS")
      );
      expect(topTeamsQueryCall).toBeDefined();
      expect(topTeamsQueryCall?.[0]).toContain("discarded_at IS NULL");
    });
  });
});
