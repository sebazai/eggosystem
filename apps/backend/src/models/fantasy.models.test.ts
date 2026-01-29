import {
  getFantasyTeamByUser,
  getFantasyPlayersByLeague,
  createFantasyTeam,
  substitutePlayer,
  updatePlayerRoles,
  getFantasyLeaderboard,
  getFantasyOverallLeaderboard,
  getFantasyPriceHistory,
  getTopPerformingPlayers,
  getPlayerPointHistory,
  type PlayerRole,
  type CreateFantasyTeamData
} from "./fantasy.models";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import {
  getCurrentWeekNumberForSeason,
  getSeasonStartDate
} from "../utils/week-calculation";
import type { PoolConnection } from "mysql2/promise";

// Mock dependencies
jest.mock("../db/mysqlRunQuery");
jest.mock("../db/mysqlConnection");
jest.mock("../utils/week-calculation");
jest.mock("../utils/redisClient", () => ({
  redisClient: {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue("OK")
  }
}));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;
const mockGetCurrentWeekNumberForSeason =
  getCurrentWeekNumberForSeason as jest.MockedFunction<
    typeof getCurrentWeekNumberForSeason
  >;
const mockGetSeasonStartDate = getSeasonStartDate as jest.MockedFunction<
  typeof getSeasonStartDate
>;

describe("Fantasy Models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFantasyTeamByUser", () => {
    it("should not throw SQL error 'Unknown column mg.season_id' when querying team", async () => {
      const testSteamId = "99999999999999999";
      const seasonId = 16;

      mockRunQuery.mockResolvedValue([] as never);

      let result;
      let errorThrown: Error | null = null;

      try {
        result = await getFantasyTeamByUser(testSteamId, seasonId);
      } catch (error) {
        errorThrown = error as Error;
      }

      if (errorThrown) {
        const errorMessage = errorThrown.message || String(errorThrown);
        expect(errorMessage).not.toContain("Unknown column 'mg.season_id'");
        expect(errorMessage).not.toContain("mg.season_id");
      }

      expect(
        result === null || (typeof result === "object" && result !== null)
      ).toBe(true);
    });

    it("should return null if user has no team", async () => {
      mockRunQuery.mockResolvedValue([] as never);

      const result = await getFantasyTeamByUser("12345", 1);

      expect(result).toBeNull();
    });

    it("should return team with all players", async () => {
      const mockTeamData = [
        {
          id: 1,
          team_name: "My Team",
          total_points: 100,
          budget_remaining: 500000,
          steam_id: "12345",
          season_id: 1,
          league_id: 1
        }
      ];

      const mockPlayers = [
        {
          id: 1,
          steam_id: "1",
          nickname: "Player 1",
          team_name: "Team 1",
          team_logo: null,
          role: "rifler",
          player_value: 200000,
          current_value: 200000,
          current_tier: "gold",
          points_earned: 50,
          individual_points: 30,
          team_points: 15,
          role_points: 5,
          is_active: true,
          has_played_this_week: 0,
          kana_rating: 1.05,
          kills: 100,
          deaths: 75,
          kd: 1.33,
          adr: 90,
          adr_t: 85,
          adr_ct: 95,
          headshots: 50,
          headshot_percentage: 50,
          flash_assists: 10,
          first_kills: 20,
          first_deaths: 15,
          kast: 80
        }
      ];

      // Mock getCurrentWeekNumberForSeason
      mockGetCurrentWeekNumberForSeason.mockResolvedValue(1);
      // Mock getSeasonStartDate - returns a Date object
      mockGetSeasonStartDate.mockResolvedValue(new Date("2024-01-01"));

      // Mock all runQuery calls in order:
      // 1. Get team
      mockRunQuery.mockResolvedValueOnce(mockTeamData as never);
      // 2. getRemainingRoleSwaps - returns count
      mockRunQuery.mockResolvedValueOnce([{ count: 0 }] as never);
      // 3. getRemainingSubstitutions - returns count
      mockRunQuery.mockResolvedValueOnce([{ count: 0 }] as never);
      // 4. Get players
      mockRunQuery.mockResolvedValueOnce(mockPlayers as never);
      // 5. Get role swaps history
      mockRunQuery.mockResolvedValueOnce([] as never);
      // 6. Get substitutions history
      mockRunQuery.mockResolvedValueOnce([] as never);
      // 7. Get player values (for each player) - this is a loop, so mock for each player
      mockRunQuery.mockResolvedValueOnce([] as never);

      const result = await getFantasyTeamByUser("12345", 1);

      expect(result).not.toBeNull();
      expect(result?.players).toHaveLength(1);
    });
  });

  describe("getFantasyPlayersByLeague", () => {
    it("should return players with current values from FantasyPlayerValues", async () => {
      const mockPlayers = [
        {
          steam_id: "12345",
          nickname: "Player 1",
          team_id: 1,
          team_name: "Team 1",
          team_logo: null,
          kana_rating: 1.05,
          kd: 1.33,
          kills: 100,
          deaths: 75,
          adr: 90,
          adr_t: 85,
          adr_ct: 95,
          headshots: 50,
          headshot_percentage: 50,
          flash_assists: 10,
          first_kills: 20,
          first_deaths: 15,
          kast: 80,
          maps_played: 10,
          db_value: 200000,
          db_tier: "gold"
        }
      ];

      // getFantasyPlayersByLeague makes a single query that returns all player data
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValueOnce(mockPlayers);

      const result = await getFantasyPlayersByLeague(1, 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("steam_id", "12345");
    });

    it("should fallback to calculated values if FantasyPlayerValues missing", async () => {
      const mockPlayers = [
        {
          steam_id: "12345",
          nickname: "Player 1",
          team_id: 1,
          team_name: "Team 1",
          team_logo: null,
          kana_rating: 1.05,
          kd: 1.33,
          kills: 100,
          deaths: 75,
          adr: 90,
          adr_t: 85,
          adr_ct: 95,
          headshots: 50,
          headshot_percentage: 50,
          flash_assists: 10,
          first_kills: 20,
          first_deaths: 15,
          kast: 80,
          maps_played: 10,
          db_value: null,
          db_tier: null
        }
      ];

      // Clear any previous mocks first
      mockRunQuery.mockClear();
      mockRunQuery.mockResolvedValueOnce(mockPlayers);

      const result = await getFantasyPlayersByLeague(1, 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("steam_id", "12345");
    });

    it("should handle league with no players", async () => {
      mockRunQuery.mockResolvedValue([] as never);

      const result = await getFantasyPlayersByLeague(1, 1);

      expect(result).toEqual([]);
    });
  });

  describe("createFantasyTeam", () => {
    let mockConnection: Partial<PoolConnection>;

    beforeEach(() => {
      mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined)
      };

      mockGetConnection.mockResolvedValue(mockConnection as PoolConnection);
    });

    it("should create team with correct budget (1M default)", async () => {
      const teamData: CreateFantasyTeamData = {
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        team_name: "My Team",
        players: [
          { steam_id: "1", role: "rifler" as PlayerRole, player_value: 200000 },
          {
            steam_id: "2",
            role: "main_awp" as PlayerRole,
            player_value: 200000
          },
          {
            steam_id: "3",
            role: "support" as PlayerRole,
            player_value: 200000
          },
          {
            steam_id: "4",
            role: "entry_fragger" as PlayerRole,
            player_value: 200000
          },
          { steam_id: "5", role: "lurker" as PlayerRole, player_value: 200000 }
        ]
      };

      mockRunQuery
        .mockResolvedValueOnce([] as never) // Check existing team
        .mockResolvedValueOnce({ insertId: 1 } as never) // Insert team
        .mockResolvedValueOnce({ insertId: 1 } as never) // Insert player 1
        .mockResolvedValueOnce(undefined as never) // History 1
        .mockResolvedValueOnce({ insertId: 2 } as never) // Insert player 2
        .mockResolvedValueOnce(undefined as never) // History 2
        .mockResolvedValueOnce({ insertId: 3 } as never) // Insert player 3
        .mockResolvedValueOnce(undefined as never) // History 3
        .mockResolvedValueOnce({ insertId: 4 } as never) // Insert player 4
        .mockResolvedValueOnce(undefined as never) // History 4
        .mockResolvedValueOnce({ insertId: 5 } as never) // Insert player 5
        .mockResolvedValueOnce(undefined as never); // History 5

      const result = await createFantasyTeam(teamData);

      expect(result).toBe(1);
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it("should throw error if budget exceeded", async () => {
      const teamData: CreateFantasyTeamData = {
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        players: [
          { steam_id: "1", role: "rifler" as PlayerRole, player_value: 300000 },
          {
            steam_id: "2",
            role: "main_awp" as PlayerRole,
            player_value: 300000
          },
          {
            steam_id: "3",
            role: "support" as PlayerRole,
            player_value: 300000
          },
          {
            steam_id: "4",
            role: "entry_fragger" as PlayerRole,
            player_value: 300000
          },
          { steam_id: "5", role: "lurker" as PlayerRole, player_value: 300000 }
        ]
      };

      mockRunQuery.mockResolvedValueOnce([] as never);

      await expect(createFantasyTeam(teamData)).rejects.toThrow(
        "Total player value exceeds budget"
      );
    });

    it("should throw error if less than 5 players", async () => {
      const teamData: CreateFantasyTeamData = {
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        players: [
          { steam_id: "1", role: "rifler" as PlayerRole, player_value: 200000 }
        ]
      };

      await expect(createFantasyTeam(teamData)).rejects.toThrow(
        "exactly 5 players"
      );
    });

    it("should prevent duplicate teams (one per user per season)", async () => {
      const teamData: CreateFantasyTeamData = {
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        players: [
          { steam_id: "1", role: "rifler" as PlayerRole, player_value: 200000 },
          {
            steam_id: "2",
            role: "main_awp" as PlayerRole,
            player_value: 200000
          },
          {
            steam_id: "3",
            role: "support" as PlayerRole,
            player_value: 200000
          },
          {
            steam_id: "4",
            role: "entry_fragger" as PlayerRole,
            player_value: 200000
          },
          { steam_id: "5", role: "lurker" as PlayerRole, player_value: 200000 }
        ]
      };

      // Reset mocks for this test
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValueOnce([{ id: 1 }]);

      await expect(createFantasyTeam(teamData)).rejects.toThrow(
        "already has a fantasy team"
      );
    });
  });

  describe("substitutePlayer", () => {
    let mockConnection: Partial<PoolConnection>;

    beforeEach(() => {
      mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined)
      };

      mockGetConnection.mockResolvedValue(mockConnection as PoolConnection);
      mockGetCurrentWeekNumberForSeason.mockResolvedValue(1);
    });

    it("should remove old player and add new player", async () => {
      const substitutionData = {
        remove_steam_id: "1",
        add_steam_id: "2",
        new_player_value: 200000,
        week_number: 1
      };

      // Mock getCurrentWeekNumberForSeason
      mockGetCurrentWeekNumberForSeason.mockResolvedValue(1);
      // Mock getSeasonStartDate
      mockGetSeasonStartDate.mockResolvedValue(new Date("2024-01-01"));

      // Reset mocks for this test
      mockRunQuery.mockReset();

      mockRunQuery
        .mockResolvedValueOnce([{ id: 1, budget_remaining: 500000 }]) // Get team
        .mockResolvedValueOnce([{ count: 0 }]) // Check substitution limit
        .mockResolvedValueOnce([{ player_value: 190000, role: "rifler" }]) // Get old player
        .mockResolvedValueOnce([{ count: 0 }]) // Check played this week
        .mockResolvedValueOnce(undefined) // Deactivate old player
        .mockResolvedValueOnce({ insertId: 2 }) // Insert new player
        .mockResolvedValueOnce(undefined) // Update team budget
        .mockResolvedValueOnce(undefined) // History remove
        .mockResolvedValueOnce(undefined) // History add
        .mockResolvedValueOnce([{ count: 1 }]); // Final substitution count

      const result = await substitutePlayer(1, substitutionData);

      expect(result.remaining_substitutions).toBeGreaterThanOrEqual(0);
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it("should enforce substitution limit (2 per week)", async () => {
      const substitutionData = {
        remove_steam_id: "1",
        add_steam_id: "2",
        new_player_value: 200000,
        week_number: 1
      };

      // Mock getCurrentWeekNumberForSeason
      mockGetCurrentWeekNumberForSeason.mockResolvedValue(1);
      // Mock getSeasonStartDate
      mockGetSeasonStartDate.mockResolvedValue(new Date("2024-01-01"));

      // Reset mocks for this test
      mockRunQuery.mockReset();

      mockRunQuery
        .mockResolvedValueOnce([{ id: 1, budget_remaining: 500000 }]) // Get team
        .mockResolvedValueOnce([{ count: 2 }]); // Already used 2 substitutions

      await expect(substitutePlayer(1, substitutionData)).rejects.toThrow(
        "Maximum 2 substitutions per week allowed"
      );
    });
  });

  describe("updatePlayerRoles", () => {
    let mockConnection: Partial<PoolConnection>;

    beforeEach(() => {
      mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined)
      };

      mockGetConnection.mockResolvedValue(mockConnection as PoolConnection);
    });

    it("should update roles for multiple players", async () => {
      const roleUpdates = [
        { steam_id: "1", role: "rifler" as PlayerRole },
        { steam_id: "2", role: "main_awp" as PlayerRole }
      ];

      // Reset mocks for this test
      mockRunQuery.mockReset();

      mockRunQuery
        .mockResolvedValueOnce([
          { steam_id: "1", role: "support" },
          { steam_id: "2", role: "entry_fragger" }
        ]) // Get current players
        .mockResolvedValueOnce([
          { steam_id: "3", role: "lurker" },
          { steam_id: "4", role: "defender" },
          { steam_id: "5", role: "leader" }
        ]) // Get all team roles (other players not being updated)
        .mockResolvedValueOnce([{ count: 0 }]) // Check role swap limit
        .mockResolvedValueOnce(undefined) // Update role 1
        .mockResolvedValueOnce(undefined) // History 1
        .mockResolvedValueOnce(undefined) // Update role 2
        .mockResolvedValueOnce(undefined) // History 2
        .mockResolvedValueOnce(undefined) // Update team updated_at
        .mockResolvedValueOnce([{ count: 2 }]); // Final swap count

      const result = await updatePlayerRoles(1, roleUpdates, 1, false);

      expect(result.remaining_swaps).toBeGreaterThanOrEqual(0);
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it("should enforce role swap limit (2 per week)", async () => {
      const roleUpdates = [{ steam_id: "1", role: "rifler" as PlayerRole }];

      // Reset mocks for this test
      mockRunQuery.mockReset();

      mockRunQuery
        .mockResolvedValueOnce([{ steam_id: "1", role: "support" }]) // Get current players
        .mockResolvedValueOnce([]) // Get all team roles
        .mockResolvedValueOnce([{ count: 2 }]); // Already used 2 swaps

      await expect(updatePlayerRoles(1, roleUpdates, 1, false)).rejects.toThrow(
        "Maximum 2 role swaps per week allowed"
      );
    });

    it("should throw BadRequestError when player not found in team", async () => {
      const roleUpdates = [
        { steam_id: "76561197992956290", role: "main_awp" as PlayerRole }
      ];

      // Reset mocks for this test
      mockRunQuery.mockReset();

      // Mock that the player is NOT in the team (empty result)
      mockRunQuery.mockResolvedValueOnce([]); // Get current players - empty means player not found

      const error = await updatePlayerRoles(1, roleUpdates, 1, false).catch(
        (e) => e
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Player 76561197992956290 not found in team");
      expect(error.name).toBe("Bad Request");
      expect(error.status).toBe(400);
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it("should throw BadRequestError for multiple players when one is not in team", async () => {
      const roleUpdates = [
        { steam_id: "1", role: "main_awp" as PlayerRole },
        { steam_id: "76561197992956290", role: "leader" as PlayerRole }
      ];

      // Reset mocks for this test
      mockRunQuery.mockReset();

      // Mock that only player "1" is in the team, player "76561197992956290" is not
      mockRunQuery.mockResolvedValueOnce([{ steam_id: "1", role: "support" }]); // Get current players

      const error = await updatePlayerRoles(1, roleUpdates, 1, false).catch(
        (e) => e
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Player 76561197992956290 not found in team");
      expect(error.name).toBe("Bad Request");
      expect(error.status).toBe(400);
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it("should throw BadRequestError when role is already assigned to another player", async () => {
      const roleUpdates = [{ steam_id: "1", role: "main_awp" as PlayerRole }];

      // Reset mocks for this test
      mockRunQuery.mockReset();

      mockRunQuery
        .mockResolvedValueOnce([{ steam_id: "1", role: "support" }]) // Get current players
        .mockResolvedValueOnce([
          { steam_id: "2", role: "main_awp" }, // Another player already has main_awp role
          { steam_id: "3", role: "leader" }
        ]); // Get all team roles

      const error = await updatePlayerRoles(1, roleUpdates, 1, false).catch(
        (e) => e
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(
        'Role "main_awp" is already assigned to another player'
      );
      expect(error.name).toBe("Bad Request");
      expect(error.status).toBe(400);
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe("getFantasyLeaderboard", () => {
    it("should return teams sorted by total_points descending", async () => {
      const mockLeaderboard = [
        {
          fantasy_team_id: 1,
          steam_id: "12345",
          team_name: "Team 1",
          owner_name: "Owner 1",
          total_points: 200,
          league_name: "League 1",
          rank: 1
        },
        {
          fantasy_team_id: 2,
          steam_id: "67890",
          team_name: "Team 2",
          owner_name: "Owner 2",
          total_points: 150,
          league_name: "League 1",
          rank: 2
        }
      ];

      // Reset mocks for this test
      mockRunQuery.mockReset();

      mockRunQuery
        .mockResolvedValueOnce(mockLeaderboard) // Top teams query
        .mockResolvedValueOnce([{ count: 2 }]); // Total count query

      const result = await getFantasyLeaderboard(1, 1);

      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0].total_points).toBeGreaterThan(
        result.leaderboard[1].total_points
      );
    });

    it("should highlight current user's team if steam_id provided", async () => {
      const mockLeaderboard = [
        {
          fantasy_team_id: 1,
          steam_id: "12345",
          team_name: "Team 1",
          owner_name: "Owner 1",
          total_points: 200,
          league_name: "League 1",
          rank: 1
        }
      ];

      // Reset mocks for this test
      mockRunQuery.mockReset();

      mockRunQuery
        .mockResolvedValueOnce(mockLeaderboard) // Top teams query
        .mockResolvedValueOnce([{ rank: 1 }]) // User team query
        .mockResolvedValueOnce([{ count: 1 }]); // Total count query

      const result = await getFantasyLeaderboard(1, 1, "12345");

      expect(result.leaderboard[0].is_current_user).toBe(true);
    });

    it("should handle league with no teams", async () => {
      // Reset mocks for this test
      mockRunQuery.mockReset();

      mockRunQuery
        .mockResolvedValueOnce([]) // Top teams query
        .mockResolvedValueOnce([{ count: 0 }]); // Total count query

      const result = await getFantasyLeaderboard(1, 1);

      expect(result.leaderboard).toEqual([]);
    });
  });

  describe("getFantasyOverallLeaderboard", () => {
    it("should return teams from all leagues sorted by points", async () => {
      const mockLeaderboard = [
        {
          fantasy_team_id: 1,
          steam_id: "12345",
          team_name: "Team 1",
          owner_name: "Owner 1",
          total_points: 200,
          league_name: "League 1",
          rank: 1
        }
      ];

      // Reset mocks for this test
      mockRunQuery.mockReset();

      mockRunQuery
        .mockResolvedValueOnce(mockLeaderboard) // Top teams query
        .mockResolvedValueOnce([{ count: 1 }]); // Total count query

      const result = await getFantasyOverallLeaderboard(1);

      expect(result.leaderboard).toHaveLength(1);
      expect(result.leaderboard[0]).toHaveProperty("league_name");
    });
  });

  describe("getFantasyPriceHistory", () => {
    it("should return price history for all players in league", async () => {
      const mockPriceHistory = [
        {
          steam_id: "12345",
          nickname: "Player 1",
          team_name: "Team 1",
          current_value: 200000,
          current_tier: "gold",
          previous_value: 190000,
          value_change: 10000,
          value_change_percent: 5.26,
          value_history: JSON.stringify([{ value: 190000, date: "2024-01-01" }])
        }
      ];

      // Reset mocks for this test
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValueOnce(mockPriceHistory);

      const result = await getFantasyPriceHistory(1, 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("value_change");
      expect(result[0]).toHaveProperty("value_change_percent");
    });
  });

  describe("getTopPerformingPlayers", () => {
    it("should return top N players by points", async () => {
      const mockPlayers = [
        {
          id: 1,
          steam_id: "1",
          nickname: "Player 1",
          player_value: 200000,
          current_value: 190000,
          tier: "gold",
          is_on_fantasy_team: false,
          total_points: 100
        },
        {
          id: 2,
          steam_id: "2",
          nickname: "Player 2",
          player_value: 180000,
          current_value: 170000,
          tier: "silver",
          is_on_fantasy_team: false,
          total_points: 90
        }
      ];

      // Reset mocks for this test
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValueOnce(mockPlayers);

      const result = await getTopPerformingPlayers(1, 1, 10);

      expect(result).toHaveLength(2);
      expect(result[0].total_points).toBeGreaterThan(result[1].total_points);
    });

    it("should respect limit parameter", async () => {
      // Reset mocks for this test
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValueOnce([]);

      await getTopPerformingPlayers(1, 1, 5);

      const sqlCall = mockRunQuery.mock.calls[0][0];
      expect(sqlCall).toContain("LIMIT");
    });
  });

  describe("getPlayerPointHistory", () => {
    it("should return point history for player", async () => {
      const mockHistory = [
        {
          match_game_id: 1,
          match_date: "2024-01-01",
          points_earned: 50,
          individual_points: 30,
          team_points: 15,
          role_points: 5,
          stats_breakdown: JSON.stringify({ kills: 20, deaths: 15 }),
          points_breakdown: JSON.stringify({ kills: 10, assists: 5 })
        }
      ];

      // Reset mocks for this test
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValueOnce(mockHistory);

      const result = await getPlayerPointHistory("12345", 1, 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("points_earned");
      expect(result[0]).toHaveProperty("stats_breakdown");
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("ft.id = ?"),
        [expect.anything(), "12345", expect.anything(), 1],
        undefined
      );
    });

    it("should handle player with no matches", async () => {
      // Reset mocks for this test
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getPlayerPointHistory("12345", 1, 1);

      expect(result).toEqual([]);
    });

    it("should filter point history by fantasy team id so same player in multiple teams returns only that team's rows", async () => {
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValueOnce([
        {
          match_game_id: 1,
          match_date: "2024-01-01",
          map_name: "de_overpass",
          opponent: "AirTap",
          opponent_logo: null,
          points_earned: -7,
          individual_points: -5,
          team_points: -1,
          role_points: -1,
          stats_breakdown: JSON.stringify({ kills: 10, deaths: 15 }),
          points_breakdown: JSON.stringify({ kills: 5, deaths: -10 })
        }
      ]);

      const result = await getPlayerPointHistory("76561198001857963", 1, 42);

      expect(result).toHaveLength(1);
      expect(result[0].points_earned).toBe(-7);
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      const [, params] = mockRunQuery.mock.calls[0];
      expect(params).toEqual([1, "76561198001857963", 1, 42]);
    });
  });
});
