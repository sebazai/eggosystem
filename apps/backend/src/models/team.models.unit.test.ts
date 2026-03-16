import { getTeamsForSeason, getTeamLogosByTeamIds } from "./team.models";
import { runQuery } from "../db/mysqlRunQuery";

// Mock the runQuery function
jest.mock("../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("Team Models Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTeamsForSeason", () => {
    it("should return teams for a specific season", async () => {
      const mockData = [
        {
          team_id: 1,
          team_name: "Test Team 1",
          league_name: "Test League",
          tier: 1
        },
        {
          team_id: 2,
          team_name: "Test Team 2",
          league_name: "Test League",
          tier: 2
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamsForSeason(1);

      expect(result).toEqual(mockData);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT DISTINCT"),
        [1]
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("Teams t"),
        [1]
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY t.name ASC"),
        [1]
      );
    });

    it("should handle empty results", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getTeamsForSeason(999);

      expect(result).toEqual([]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE strp.season_id = ?"),
        [999]
      );
    });

    it("should handle teams with unassigned leagues", async () => {
      const mockData = [
        {
          team_id: 1,
          team_name: "Test Team",
          league_name: "Unassigned",
          tier: null
        }
      ];

      mockRunQuery.mockResolvedValue(mockData);

      const result = await getTeamsForSeason(1);

      expect(result).toEqual(mockData);
      expect(result[0].league_name).toBe("Unassigned");
      expect(result[0].tier).toBeNull();
    });
  });

  describe("getTeamLogosByTeamIds", () => {
    it("returns empty map for empty teamIds", async () => {
      const result = await getTeamLogosByTeamIds([]);
      expect(result).toEqual(new Map());
      expect(mockRunQuery).not.toHaveBeenCalled();
    });

    it("returns map of team_id -> team_logo", async () => {
      mockRunQuery.mockResolvedValue([
        { id: 10, team_logo: "logo-a" },
        { id: 20, team_logo: null }
      ]);

      const result = await getTeamLogosByTeamIds([10, 20]);

      expect(result).toEqual(
        new Map([
          [10, "logo-a"],
          [20, null]
        ])
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT id, team_logo FROM Teams"),
        [10, 20]
      );
    });

    it("deduplicates teamIds", async () => {
      mockRunQuery.mockResolvedValue([{ id: 10, team_logo: "x" }]);

      await getTeamLogosByTeamIds([10, 10, 10]);

      expect(mockRunQuery).toHaveBeenCalledWith(expect.any(String), [10]);
    });
  });
});
