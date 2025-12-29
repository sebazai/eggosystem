import { getMapNamesByIds } from "./maps.services";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery");

describe("Maps Services", () => {
  describe("getMapNamesByIds", () => {
    const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return map names for valid map IDs", async () => {
      const mockMaps = [
        { id: 1, name: "de_dust2" },
        { id: 2, name: "de_mirage" },
        { id: 3, name: "de_inferno" }
      ];

      mockRunQuery.mockResolvedValue(mockMaps);

      const result = await getMapNamesByIds([1, 2, 3]);

      expect(result).toEqual(["de_dust2", "de_mirage", "de_inferno"]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT id, name FROM Maps WHERE id IN (?, ?, ?)",
        [1, 2, 3]
      );
    });

    it("should return names in the same order as input IDs", async () => {
      const mockMaps = [
        { id: 3, name: "de_inferno" },
        { id: 1, name: "de_dust2" },
        { id: 2, name: "de_mirage" }
      ];

      mockRunQuery.mockResolvedValue(mockMaps);

      const result = await getMapNamesByIds([1, 2, 3]);

      expect(result).toEqual(["de_dust2", "de_mirage", "de_inferno"]);
    });

    it("should return empty array for empty input", async () => {
      const result = await getMapNamesByIds([]);

      expect(result).toEqual([]);
      expect(mockRunQuery).not.toHaveBeenCalled();
    });

    it("should filter out missing map IDs", async () => {
      const mockMaps = [
        { id: 1, name: "de_dust2" },
        { id: 3, name: "de_inferno" }
      ];

      mockRunQuery.mockResolvedValue(mockMaps);

      const result = await getMapNamesByIds([1, 2, 3]);

      expect(result).toEqual(["de_dust2", "de_inferno"]);
    });

    it("should handle single map ID", async () => {
      const mockMaps = [{ id: 1, name: "de_dust2" }];

      mockRunQuery.mockResolvedValue(mockMaps);

      const result = await getMapNamesByIds([1]);

      expect(result).toEqual(["de_dust2"]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT id, name FROM Maps WHERE id IN (?)",
        [1]
      );
    });

    it("should return empty array when no maps found", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getMapNamesByIds([1, 2, 3]);

      expect(result).toEqual([]);
    });
  });
});
