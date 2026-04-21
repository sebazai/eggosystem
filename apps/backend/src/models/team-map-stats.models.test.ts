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
      // Mock the three parallel stats queries first (these are called before map pool):
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

      // 4. Map pool query (called after stats, returns empty to skip complementing)
      mockRunQuery.mockResolvedValueOnce([]);

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

      // Verify all four queries were called (3 stats queries + map pool query)
      expect(mockRunQuery).toHaveBeenCalledTimes(4);

      // Check the base stats query (index 0)
      const baseStatsQuery = mockRunQuery.mock.calls[0][0] as string;
      const baseStatsParams = mockRunQuery.mock.calls[0][1] as (
        | string
        | number
      )[];

      // Check the side stats query (index 1)
      const sideStatsQuery = mockRunQuery.mock.calls[1][0] as string;
      const sideStatsParams = mockRunQuery.mock.calls[1][1] as (
        | string
        | number
      )[];

      // Check the advantage stats query (index 2)
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
        avg_score: 13.5,
        avg_opponent_score: 8.5,
        ct_win_percentage: 53.7,
        t_win_percentage: 54.6,
        ct_kd: 1.07,
        t_kd: 1.09,
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
        avg_score: 13,
        avg_opponent_score: 9,
        ct_win_percentage: 72.5,
        t_win_percentage: 41.0,
        ct_kd: 1.45,
        t_kd: 0.82,
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

    it("should complement stats with SeasonActiveMapPool maps in alphabetical order", async () => {
      // Mock the three parallel stats queries first (team only played 2 of 4 maps):
      // 1. Base stats query - only 2 maps (with all required fields from query)
      mockRunQuery.mockResolvedValueOnce([
        {
          map_id: 3,
          map_name: "de_dust2",
          maps_played: 5,
          wins: 3,
          losses: 2,
          win_percentage: 60.0,
          avg_score: 13,
          avg_opponent_score: 10
        },
        {
          map_id: 1,
          map_name: "de_mirage",
          maps_played: 3,
          wins: 2,
          losses: 1,
          win_percentage: 66.7,
          avg_score: 13.5,
          avg_opponent_score: 9.5
        }
      ]);

      // 2. Side stats query
      mockRunQuery.mockResolvedValueOnce([
        {
          map_id: 3,
          kills_ct: 150,
          deaths_ct: 100,
          kills_t: 100,
          deaths_t: 100,
          first_kills: 10,
          first_deaths: 8,
          first_kills_t: 5,
          first_deaths_t: 4,
          first_kills_ct: 5,
          first_deaths_ct: 4
        },
        {
          map_id: 1,
          kills_ct: 120,
          deaths_ct: 100,
          kills_t: 110,
          deaths_t: 100,
          first_kills: 8,
          first_deaths: 7,
          first_kills_t: 4,
          first_deaths_t: 3,
          first_kills_ct: 4,
          first_deaths_ct: 4
        }
      ]);

      // 3. Advantage stats query
      mockRunQuery.mockResolvedValueOnce([
        {
          map_id: 3,
          fk_5v4_won: 5,
          fk_5v4_total: 10,
          fk_4v5_won: 2,
          fk_4v5_total: 8,
          fk_5v4_won_ct: 3,
          fk_5v4_total_ct: 5,
          fk_5v4_won_t: 2,
          fk_5v4_total_t: 5,
          fk_4v5_won_ct: 1,
          fk_4v5_total_ct: 4,
          fk_4v5_won_t: 1,
          fk_4v5_total_t: 4
        },
        {
          map_id: 1,
          fk_5v4_won: 4,
          fk_5v4_total: 8,
          fk_4v5_won: 1,
          fk_4v5_total: 7,
          fk_5v4_won_ct: 2,
          fk_5v4_total_ct: 4,
          fk_5v4_won_t: 2,
          fk_5v4_total_t: 4,
          fk_4v5_won_ct: 0,
          fk_4v5_total_ct: 3,
          fk_4v5_won_t: 1,
          fk_4v5_total_t: 4
        }
      ]);

      // 4. Map pool query (called after stats, returns 4 maps)
      mockRunQuery.mockResolvedValueOnce([
        { map_id: 5, map_name: "de_ancient" },
        { map_id: 3, map_name: "de_dust2" },
        { map_id: 1, map_name: "de_mirage" },
        { map_id: 7, map_name: "de_nuke" }
      ]);

      const parsedParams: ParsedParams = {
        season_ids: [14],
        league_ids: [],
        map_ids: [],
        team_ids: [],
        stages: []
      };

      const result = await getTeamEnhancedMapStats(1650, parsedParams);

      // Verify 4 queries were called (map pool + 3 stats queries)
      expect(mockRunQuery).toHaveBeenCalledTimes(4);

      // Verify result includes ALL 4 maps from active pool
      expect(result).toHaveLength(4);

      // Verify maps are in alphabetical order
      expect(result[0].map_name).toBe("de_ancient");
      expect(result[1].map_name).toBe("de_dust2");
      expect(result[2].map_name).toBe("de_mirage");
      expect(result[3].map_name).toBe("de_nuke");

      // Verify unplayed maps (ancient, nuke) have zero stats
      expect(result[0]).toMatchObject({
        map_id: 5,
        map_name: "de_ancient",
        maps_played: 0,
        wins: 0,
        losses: 0,
        win_percentage: 0,
        avg_score: 0,
        avg_opponent_score: 0
      });

      expect(result[3]).toMatchObject({
        map_id: 7,
        map_name: "de_nuke",
        maps_played: 0,
        wins: 0,
        losses: 0,
        win_percentage: 0,
        avg_score: 0,
        avg_opponent_score: 0
      });

      // Verify played maps (dust2, mirage) have correct stats
      expect(result[1]).toMatchObject({
        map_id: 3,
        map_name: "de_dust2",
        maps_played: 5,
        wins: 3,
        losses: 2,
        win_percentage: 60
      });

      expect(result[2]).toMatchObject({
        map_id: 1,
        map_name: "de_mirage",
        maps_played: 3,
        wins: 2,
        losses: 1,
        win_percentage: 66.7
      });
    });

    it("should return only played maps when no season filter is provided", async () => {
      // When season_ids is empty, the map pool query is never called (early return)
      // So we only mock the three parallel queries with only 1 map:
      mockRunQuery.mockResolvedValueOnce([
        {
          map_id: 1,
          map_name: "de_mirage",
          maps_played: 2,
          wins: 1,
          losses: 1,
          win_percentage: 50,
          avg_score: "13.0",
          avg_opponent_score: "13.0"
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          map_id: 1,
          kills_ct: 100,
          deaths_ct: 100,
          kills_t: 100,
          deaths_t: 100,
          first_kills: 5,
          first_deaths: 5,
          first_kills_t: 2,
          first_deaths_t: 3,
          first_kills_ct: 3,
          first_deaths_ct: 2
        }
      ]);

      mockRunQuery.mockResolvedValueOnce([
        {
          map_id: 1,
          fk_5v4_won: 2,
          fk_5v4_total: 5,
          fk_4v5_won: 1,
          fk_4v5_total: 5,
          fk_5v4_won_ct: 1,
          fk_5v4_total_ct: 2,
          fk_5v4_won_t: 1,
          fk_5v4_total_t: 3,
          fk_4v5_won_ct: 0,
          fk_4v5_total_ct: 2,
          fk_4v5_won_t: 1,
          fk_4v5_total_t: 3
        }
      ]);

      const parsedParams: ParsedParams = {
        season_ids: [], // No season filter
        league_ids: [],
        map_ids: [],
        team_ids: [],
        stages: []
      };

      const result = await getTeamEnhancedMapStats(1650, parsedParams);

      // Verify only 3 queries (no map pool query when season_ids is empty)
      expect(mockRunQuery).toHaveBeenCalledTimes(3);

      // Verify result includes only played maps (not complemented)
      expect(result).toHaveLength(1);
      expect(result[0].map_name).toBe("de_mirage");
    });
  });
});
