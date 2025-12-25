import { getTeamEnhancedMapStats } from "./team-map-stats.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type ParsedParams } from "@eggosystem/types";

// Mock the database query function
jest.mock("../db/mysqlRunQuery");

describe("Team Map Stats Models", () => {
  const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTeamEnhancedMapStats", () => {
    it("should return enhanced map stats with CT and T side data from database", async () => {
      // Mock the three parallel queries:
      // 1. Base stats query
      mockRunQuery.mockResolvedValueOnce([
        {
          map_id: 1,
          map_name: "de_mirage",
          maps_played: 2,
          wins: 5,
          losses: 5,
          win_percentage: 50,
          avg_score: "13.5",
          avg_opponent_score: "8.5"
        },
        {
          map_id: 3,
          map_name: "de_dust2",
          maps_played: 2,
          wins: 10,
          losses: 0,
          win_percentage: 100,
          avg_score: "13.0",
          avg_opponent_score: "9.0"
        }
      ]);

      // 2. Side stats query
      mockRunQuery.mockResolvedValueOnce([
        {
          map_id: 1,
          kills_ct: 130,
          deaths_ct: 121,
          kills_t: 142,
          deaths_t: 130,
          first_kills: 0,
          first_deaths: 0,
          first_kills_t: 0,
          first_deaths_t: 0,
          first_kills_ct: 0,
          first_deaths_ct: 0
        },
        {
          map_id: 3,
          kills_ct: 145,
          deaths_ct: 100,
          kills_t: 82,
          deaths_t: 100,
          first_kills: 0,
          first_deaths: 0,
          first_kills_t: 0,
          first_deaths_t: 0,
          first_kills_ct: 0,
          first_deaths_ct: 0
        }
      ]);

      // 3. Advantage stats query
      mockRunQuery.mockResolvedValueOnce([
        {
          map_id: 1,
          fk_5v4_won: 0,
          fk_5v4_total: 0,
          fk_4v5_won: 0,
          fk_4v5_total: 0,
          fk_5v4_won_ct: 0,
          fk_5v4_total_ct: 0,
          fk_5v4_won_t: 0,
          fk_5v4_total_t: 0,
          fk_4v5_won_ct: 0,
          fk_4v5_total_ct: 0,
          fk_4v5_won_t: 0,
          fk_4v5_total_t: 0
        },
        {
          map_id: 3,
          fk_5v4_won: 0,
          fk_5v4_total: 0,
          fk_4v5_won: 0,
          fk_4v5_total: 0,
          fk_5v4_won_ct: 0,
          fk_5v4_total_ct: 0,
          fk_5v4_won_t: 0,
          fk_5v4_total_t: 0,
          fk_4v5_won_ct: 0,
          fk_4v5_total_ct: 0,
          fk_4v5_won_t: 0,
          fk_4v5_total_t: 0
        }
      ]);

      // Create parsed params
      const parsedParams: ParsedParams = {
        season_ids: [14],
        league_ids: [],
        map_ids: [],
        team_ids: [],
        stages: []
      };

      // Call the function
      const result = await getTeamEnhancedMapStats(1650, parsedParams);

      // Verify all three queries were called
      expect(mockRunQuery).toHaveBeenCalledTimes(3);

      // Check the base stats query
      const baseStatsQuery = mockRunQuery.mock.calls[0][0] as string;
      const baseStatsParams = mockRunQuery.mock.calls[0][1] as (
        | string
        | number
      )[];

      // Check the side stats query
      const sideStatsQuery = mockRunQuery.mock.calls[1][0] as string;
      const sideStatsParams = mockRunQuery.mock.calls[1][1] as (
        | string
        | number
      )[];

      // Check the advantage stats query
      const advantageStatsQuery = mockRunQuery.mock.calls[2][0] as string;
      const advantageStatsParams = mockRunQuery.mock.calls[2][1] as (
        | string
        | number
      )[];

      // Check base stats query
      expect(baseStatsQuery).toContain("FROM MatchGames mg");
      expect(baseStatsQuery).toContain("JOIN Maps maps ON mg.map_id = maps.id");
      expect(baseStatsQuery).toContain("JOIN TeamGameScores tgs");
      expect(baseStatsParams).toHaveLength(4); // teamId, teamId, teamId, season_id
      expect(baseStatsParams[0]).toBe(1650);
      expect(baseStatsParams[3]).toBe(14);

      // Check side stats query
      expect(sideStatsQuery).toContain("FROM MatchGames mg");
      expect(sideStatsQuery).toContain("JOIN PlayerStats ps");
      expect(sideStatsQuery).toContain("JOIN SeasonTeamPlayers stp");
      expect(sideStatsQuery).toContain("SUM(ps.kills_ct)");
      expect(sideStatsQuery).toContain("SUM(ps.deaths_ct)");
      expect(sideStatsQuery).toContain("SUM(ps.kills_t)");
      expect(sideStatsQuery).toContain("SUM(ps.deaths_t)");
      expect(sideStatsParams).toHaveLength(2); // teamId, season_id
      expect(sideStatsParams[0]).toBe(1650);
      expect(sideStatsParams[1]).toBe(14);

      // Check advantage stats query - uses derived table
      expect(advantageStatsQuery).toContain("FROM (SELECT ? as tid) p");
      expect(advantageStatsQuery).toContain("CROSS JOIN MatchGames mg");
      expect(advantageStatsQuery).toContain("LEFT JOIN (");
      expect(advantageStatsQuery).toContain("FROM MapRoundStats mrs");
      expect(advantageStatsParams).toHaveLength(2); // teamId, season_id
      expect(advantageStatsParams[0]).toBe(1650);
      expect(advantageStatsParams[1]).toBe(14);

      // Check that result contains expected data
      expect(result).toHaveLength(2);

      // Check first map
      expect(result[0]).toEqual({
        map_id: 1,
        map_name: "de_mirage",
        maps_played: 2,
        wins: 5,
        losses: 5,
        win_percentage: 50,
        avg_score: "13.5",
        avg_opponent_score: "8.5",
        ct_win_percentage: 53.7,
        t_win_percentage: 54.6,
        ct_kd: "1.07",
        t_kd: "1.09",
        kills_ct: 130,
        deaths_ct: 121,
        kills_t: 142,
        deaths_t: 130,
        // Openings stats
        first_kills: 0,
        first_deaths: 0,
        first_kills_t: 0,
        first_deaths_t: 0,
        first_kills_ct: 0,
        first_deaths_ct: 0,
        // Advantage stats
        fk_5v4_won: 0,
        fk_5v4_total: 0,
        fk_4v5_won: 0,
        fk_4v5_total: 0,
        fk_5v4_won_ct: 0,
        fk_5v4_total_ct: 0,
        fk_5v4_won_t: 0,
        fk_5v4_total_t: 0,
        fk_4v5_won_ct: 0,
        fk_4v5_total_ct: 0,
        fk_4v5_won_t: 0,
        fk_4v5_total_t: 0
      });

      // Check second map
      expect(result[1]).toEqual({
        map_id: 3,
        map_name: "de_dust2",
        maps_played: 2,
        wins: 10,
        losses: 0,
        win_percentage: 100,
        avg_score: "13.0",
        avg_opponent_score: "9.0",
        ct_win_percentage: 72.5,
        t_win_percentage: 41.0,
        ct_kd: "1.45",
        t_kd: "0.82",
        kills_ct: 145,
        deaths_ct: 100,
        kills_t: 82,
        deaths_t: 100,
        // Openings stats
        first_kills: 0,
        first_deaths: 0,
        first_kills_t: 0,
        first_deaths_t: 0,
        first_kills_ct: 0,
        first_deaths_ct: 0,
        // Advantage stats
        fk_5v4_won: 0,
        fk_5v4_total: 0,
        fk_4v5_won: 0,
        fk_4v5_total: 0,
        fk_5v4_won_ct: 0,
        fk_5v4_total_ct: 0,
        fk_5v4_won_t: 0,
        fk_5v4_total_t: 0,
        fk_4v5_won_ct: 0,
        fk_4v5_total_ct: 0,
        fk_4v5_won_t: 0,
        fk_4v5_total_t: 0
      });
    });
  });
});
