import { getTeamMapVetoStats } from "./team-map-veto-stats.models";
import { runQuery } from "../db/mysqlRunQuery";
import { type ParsedParams } from "@eggosystem/types";

// Mock the database query function
jest.mock("../db/mysqlRunQuery");

describe("Team Map Veto Stats Models", () => {
  const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTeamMapVetoStats", () => {
    it("should return aggregated veto stats with picks and bans from database", async () => {
      // Mock the veto stats query
      mockRunQuery.mockResolvedValueOnce([
        {
          map_id: 1,
          map_name: "de_mirage",
          picks: 5,
          bans: 3
        },
        {
          map_id: 2,
          map_name: "de_inferno",
          picks: 2,
          bans: 8
        }
      ]);

      // Mock the map pool query (returns empty to not complement)
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
      const result = await getTeamMapVetoStats(1650, parsedParams);

      // Verify both queries were called
      expect(mockRunQuery).toHaveBeenCalledTimes(2);
      const sqlQuery = mockRunQuery.mock.calls[0][0] as string;
      const sqlParams = mockRunQuery.mock.calls[0][1] as (string | number)[];

      // Check query contains expected elements (with subquery for deduplication)
      expect(sqlQuery).toContain("SELECT DISTINCT");
      expect(sqlQuery).toContain("FROM MatchTeamMapVetoes mtmv");
      expect(sqlQuery).toContain("JOIN Matches m ON mtmv.match_id = m.id");
      expect(sqlQuery).toContain("WHERE mtmv.team_id = ?");
      expect(sqlQuery).toContain("external_match_room_id");
      expect(sqlQuery).toContain("JOIN Maps maps ON mtmv.map_id = maps.id");
      expect(sqlQuery).toContain(
        "SUM(CASE WHEN mtmv.action IN ('pick', 'decider') THEN 1 ELSE 0 END) as picks"
      );
      expect(sqlQuery).toContain(
        "SUM(CASE WHEN mtmv.action = 'drop' THEN 1 ELSE 0 END) as bans"
      );
      expect(sqlQuery).toContain("GROUP BY maps.id, maps.name");

      // Check parameters
      expect(sqlParams[0]).toBe(1650); // team_id
      expect(sqlParams[1]).toBe(14); // season_id from parsedParams

      // Check that result contains expected data
      expect(result).toHaveLength(2);

      // Check first map
      expect(result[0]).toEqual({
        map_id: 1,
        map_name: "de_mirage",
        picks: 5,
        bans: 3
      });

      // Check second map
      expect(result[1]).toEqual({
        map_id: 2,
        map_name: "de_inferno",
        picks: 2,
        bans: 8
      });
    });

    it("should return empty array when no veto data exists", async () => {
      // Mock the veto stats query (empty)
      mockRunQuery.mockResolvedValueOnce([]);

      // Mock the map pool query
      mockRunQuery.mockResolvedValueOnce([]);

      const parsedParams: ParsedParams = {
        season_ids: [14],
        league_ids: [],
        map_ids: [],
        team_ids: [],
        stages: []
      };

      const result = await getTeamMapVetoStats(9999, parsedParams);

      expect(result).toEqual([]);
    });
  });
});
