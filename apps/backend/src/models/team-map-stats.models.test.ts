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

      // Check that it's using a subquery for side stats
      expect(sqlQuery).toContain("LEFT JOIN (");
      expect(sqlQuery).toContain("FROM PlayerStats ps");
      expect(sqlQuery).toContain(
        "JOIN SeasonTeamPlayers stp ON stp.steam_id = ps.steam_id AND stp.team_id = ? AND stp.season_id = ("
      );
      expect(sqlQuery).toContain("GROUP BY ps.game_id");
      expect(sqlQuery).toContain(") side ON side.game_id = mg.id");

      // Check that we're selecting summed side stats
      expect(sqlQuery).toContain("SUM(side.game_kills_ct) as kills_ct");
      expect(sqlQuery).toContain("SUM(side.game_deaths_ct) as deaths_ct");
      expect(sqlQuery).toContain("SUM(side.game_kills_t) as kills_t");
      expect(sqlQuery).toContain("SUM(side.game_deaths_t) as deaths_t");

      // Check parameters
      expect(sqlParams[0]).toBe(1650); // team_id for TeamGameScores join
      expect(sqlParams[1]).toBe(1650); // team_id for SeasonTeamPlayers join
      expect(sqlParams[2]).toBe(14); // season_id from parsedParams

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
        deaths_t: 130
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
        deaths_t: 100
      });
    });
  });
});
