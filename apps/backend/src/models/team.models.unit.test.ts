import { getTeamsForSeason } from "./team.models";
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
});
