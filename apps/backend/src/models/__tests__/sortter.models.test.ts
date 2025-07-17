import { runQuery } from "../../db/mysqlRunQuery";
import {
  getTeamValuesForSorter,
  getTeamPlayerValuesForSortter
} from "../sortter.models";

// Mock the database module
jest.mock("../../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("Sortter Models - kana_elo filtering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTeamValuesForSorter", () => {
    it("should filter out players with null kana_elo", async () => {
      // Mock the query to return some results
      mockRunQuery.mockResolvedValueOnce([
        {
          team_id: 1,
          team_name: "Test Team",
          team_logo: "test.png",
          league_name: "Test League",
          top5_sum: 1000,
          avg4: 250,
          top5_values: "[250, 200, 150, 100, 50]"
        }
      ]);

      await getTeamValuesForSorter(16, false);

      // Verify that the query includes the kana_elo IS NOT NULL filter
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("AND spr.kana_elo IS NOT NULL"),
        [16]
      );
    });

    it("should include kana_elo filter in historical mode", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      await getTeamValuesForSorter(16, true);

      // Verify that the query includes the kana_elo IS NOT NULL filter even in historical mode
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("AND spr.kana_elo IS NOT NULL"),
        [16]
      );
    });
  });

  describe("getTeamPlayerValuesForSortter", () => {
    it("should filter out players with null kana_elo", async () => {
      mockRunQuery.mockResolvedValueOnce([
        {
          name: "Test Player",
          steamid: "76561198123456789",
          cs2_rank: 15,
          faceit_level: 10,
          faceit_elo: 1500,
          hours: 1000,
          kanarating: 1.5,
          fkd: 1.2,
          kana_elo: 250,
          calculus: null
        }
      ]);

      await getTeamPlayerValuesForSortter(16, 1, false);

      // Verify that the query includes the kana_elo IS NOT NULL filter
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("AND spr.kana_elo IS NOT NULL"),
        [16, 1]
      );
    });

    it("should include kana_elo filter in historical mode", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      await getTeamPlayerValuesForSortter(16, 1, true);

      // Verify that the query includes the kana_elo IS NOT NULL filter even in historical mode
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("AND spr.kana_elo IS NOT NULL"),
        [16, 1]
      );
    });
  });
});
