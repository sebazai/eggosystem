import { getLeaderboard, leaderboardExpressions } from "./leaderboards.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type LeaderboardResponse } from "@eggosystem/types";

jest.mock("../db/mysqlRunQuery");

describe("leaderboards.models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLeaderboard", () => {
    it("should call runQuery with the correct parameters for basic stats", async () => {
      const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
      mockRunQuery.mockResolvedValueOnce([
        {
          steam_id: "123",
          nickname: "player1",
          team_name: "team1",
          team_logo: "logo1.png",
          matches_played: 5,
          kills: 100
        }
      ]);

      const result = await getLeaderboard({
        season_ids: [1],
        league_ids: [2],
        team_ids: [3],
        stages: [1],
        map_ids: [1, 2],
        leaderboards: "kills"
      });

      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      expect(mockRunQuery.mock.calls[0][0]).toContain(
        leaderboardExpressions.kills
      );
      expect(result).toEqual({
        kills: [
          {
            steam_id: "123",
            nickname: "player1",
            team_name: "team1",
            team_logo: "logo1.png",
            matches_played: 5,
            kills: 100
          }
        ]
      });
    });

    it("should call runQuery with the correct parameters for new derived stats", async () => {
      const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
      mockRunQuery.mockResolvedValueOnce([
        {
          steam_id: "123",
          nickname: "player1",
          team_name: "team1",
          team_logo: "logo1.png",
          matches_played: 5,
          kills_per_round: 0.75
        }
      ]);

      const result = await getLeaderboard({
        season_ids: [1],
        team_ids: [],
        league_ids: [],
        stages: [],
        map_ids: [],
        leaderboards: "kills_per_round"
      });

      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      expect(mockRunQuery.mock.calls[0][0]).toContain(
        leaderboardExpressions.kills_per_round
      );
      expect(result).toEqual({
        kills_per_round: [
          {
            steam_id: "123",
            nickname: "player1",
            team_name: "team1",
            team_logo: "logo1.png",
            matches_played: 5,
            kills_per_round: 0.75
          }
        ]
      });
    });

    it("should call runQuery with the correct parameters for avg enemy flash time", async () => {
      const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
      mockRunQuery.mockResolvedValueOnce([
        {
          steam_id: "123",
          nickname: "player1",
          team_name: "team1",
          team_logo: "logo1.png",
          matches_played: 5,
          avg_enemy_flash_time: 1.5
        }
      ]);

      const result = await getLeaderboard({
        season_ids: [1],
        team_ids: [],
        league_ids: [],
        stages: [],
        map_ids: [],
        leaderboards: "avg_enemy_flash_time"
      });

      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      expect(mockRunQuery.mock.calls[0][0]).toContain(
        leaderboardExpressions.avg_enemy_flash_time
      );
      expect(result).toEqual({
        avg_enemy_flash_time: [
          {
            steam_id: "123",
            nickname: "player1",
            team_name: "team1",
            team_logo: "logo1.png",
            matches_played: 5,
            avg_enemy_flash_time: 1.5
          }
        ]
      });
    });

    it("should throw an error when leaderboards type is not provided", async () => {
      await expect(
        getLeaderboard({
          season_ids: [1],
          team_ids: [],
          league_ids: [],
          stages: [],
          map_ids: [],
          leaderboards: undefined as unknown as keyof LeaderboardResponse
        })
      ).rejects.toThrow("Leaderboards type is required");
    });

    it("should throw an error when invalid leaderboards type is provided", async () => {
      await expect(
        getLeaderboard({
          season_ids: [1],
          team_ids: [],
          league_ids: [],
          stages: [],
          map_ids: [],
          leaderboards: "invalid_type" as unknown as keyof LeaderboardResponse
        })
      ).rejects.toThrow("Invalid leaderboards type: invalid_type");
    });
  });
});
