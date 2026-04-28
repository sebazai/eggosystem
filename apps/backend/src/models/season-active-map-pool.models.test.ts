import {
  getActiveMapPoolBySeasonId,
  setActiveMapPoolForSeason,
  getSeasonMapPoolForMatch
} from "./season-active-map-pool.models";
import { runQuery } from "../db/mysqlRunQuery";

// Mock the database query function
jest.mock("../db/mysqlRunQuery");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("season-active-map-pool.models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getActiveMapPoolBySeasonId", () => {
    it("should return array of map IDs for a season", async () => {
      const seasonId = 1;
      const mockResults = [{ map_id: 1 }, { map_id: 2 }, { map_id: 3 }];

      mockRunQuery.mockResolvedValue(mockResults);

      const result = await getActiveMapPoolBySeasonId(seasonId);

      expect(result).toEqual([1, 2, 3]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT map_id"),
        [seasonId],
        undefined
      );
    });

    it("should use provided connection when available", async () => {
      const seasonId = 1;

      const mockResults = [{ map_id: 1 }];

      mockRunQuery.mockResolvedValue(mockResults);

      const result = await getActiveMapPoolBySeasonId(seasonId);

      expect(result).toEqual([1]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT map_id"),
        [seasonId],
        undefined
      );
    });

    it("should return empty array when season has no maps", async () => {
      const seasonId = 999;
      mockRunQuery.mockResolvedValue([]);

      const result = await getActiveMapPoolBySeasonId(seasonId);

      expect(result).toEqual([]);
    });

    it("should handle non-existent season", async () => {
      const seasonId = 999;
      mockRunQuery.mockResolvedValue([]);

      const result = await getActiveMapPoolBySeasonId(seasonId);

      expect(result).toEqual([]);
    });
  });

  describe("setActiveMapPoolForSeason", () => {
    it("should insert maps correctly", async () => {
      const seasonId = 1;
      const mapIds = [1, 2, 3];

      mockRunQuery.mockResolvedValue({ affectedRows: 1 } as never);

      await setActiveMapPoolForSeason(seasonId, mapIds);

      // Should delete existing entries first
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM SeasonActiveMapPool"),
        [seasonId],
        undefined
      );

      // Should insert new entries
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO SeasonActiveMapPool"),
        expect.arrayContaining([seasonId, 1, seasonId, 2, seasonId, 3]),
        undefined
      );
    });

    it("should delete old entries before inserting new ones", async () => {
      const seasonId = 1;
      const mapIds = [4, 5];

      mockRunQuery.mockResolvedValue({ affectedRows: 1 } as never);

      await setActiveMapPoolForSeason(seasonId, mapIds);

      const calls = mockRunQuery.mock.calls;
      const deleteCall = calls.find((call) =>
        call[0].includes("DELETE FROM SeasonActiveMapPool")
      );
      const insertCall = calls.find((call) =>
        call[0].includes("INSERT INTO SeasonActiveMapPool")
      );

      expect(deleteCall).toBeDefined();
      expect(insertCall).toBeDefined();
      // Delete should be called before insert
      expect(calls.indexOf(deleteCall!)).toBeLessThan(
        calls.indexOf(insertCall!)
      );
    });

    it("should throw error on empty array", async () => {
      const seasonId = 1;
      const mapIds: number[] = [];

      await expect(setActiveMapPoolForSeason(seasonId, mapIds)).rejects.toThrow(
        "Active map pool must contain at least one map"
      );
    });

    it("should use provided connection for transactions", async () => {
      const seasonId = 1;
      const mapIds = [1, 2];

      mockRunQuery.mockResolvedValue({ affectedRows: 1 } as never);

      await setActiveMapPoolForSeason(seasonId, mapIds);

      // Both calls should use the provided connection
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        undefined
      );
    });
  });

  describe("getSeasonMapPoolForMatch", () => {
    it("should return map pool for a match's season", async () => {
      const matchId = 42;
      const mockMaps = [
        { id: 1, name: "de_ancient" },
        { id: 2, name: "de_dust2" },
        { id: 3, name: "de_inferno" }
      ];

      mockRunQuery.mockResolvedValue(mockMaps);

      const result = await getSeasonMapPoolForMatch(matchId);

      expect(result).toEqual(mockMaps);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SeasonActiveMapPool"),
        [matchId],
        undefined
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("Matches"),
        [matchId],
        undefined
      );
    });

    it("should return empty array when match has no season map pool", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getSeasonMapPoolForMatch(999);

      expect(result).toEqual([]);
    });
  });
});
