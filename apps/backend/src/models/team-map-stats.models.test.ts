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
      // Mock the database response with CT/T side data
      mockRunQuery.mockResolvedValueOnce([
        {
          map_id: 1,
          map_name: "de_mirage",
          maps_played: 2,
          wins: 5,
          losses: 5,
          win_percentage: 50,
          avg_score: "13.5",
          avg_opponent_score: "8.5",
          kills_ct: 130,
          deaths_ct: 121,
          kills_t: 142,
          deaths_t: 130
        },
        {
          map_id: 3,
          map_name: "de_dust2",
          maps_played: 2,
          wins: 10,
          losses: 0,
          win_percentage: 100,
          avg_score: "13.0",
          avg_opponent_score: "9.0",
          kills_ct: 145,
          deaths_ct: 100,
          kills_t: 82,
          deaths_t: 100
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

      // Verify the SQL query includes joins to get CT/T side data
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
      const sqlQuery = mockRunQuery.mock.calls[0][0] as string;
      const sqlParams = mockRunQuery.mock.calls[0][1] as (string | number)[];

      // Check that it uses a derived table for the team parameter
      expect(sqlQuery).toContain("FROM (SELECT ? as tid) p");
      expect(sqlQuery).toContain("CROSS JOIN MatchGames mg");

      // Check that it's using a subquery for side stats
      expect(sqlQuery).toContain("LEFT JOIN (");
      expect(sqlQuery).toContain("FROM PlayerStats ps");
      expect(sqlQuery).toContain(
        "JOIN SeasonTeamPlayers stp ON stp.steam_id = ps.steam_id AND stp.season_id = ("
      );
      expect(sqlQuery).toContain("GROUP BY ps.match_game_id, stp.team_id");
      expect(sqlQuery).toContain(
        ") side ON side.match_game_id = mg.id AND side.stat_team_id = p.tid"
      );

      // Check that we're selecting summed side stats
      expect(sqlQuery).toContain("SUM(side.game_kills_ct) as kills_ct");
      expect(sqlQuery).toContain("SUM(side.game_deaths_ct) as deaths_ct");
      expect(sqlQuery).toContain("SUM(side.game_kills_t) as kills_t");
      expect(sqlQuery).toContain("SUM(side.game_deaths_t) as deaths_t");

      // Check parameters - now just [teamId, ...filterParams]
      expect(sqlParams).toHaveLength(2);
      expect(sqlParams[0]).toBe(1650); // team_id in derived table
      expect(sqlParams[1]).toBe(14); // season_id from parsedParams

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
