import { runQuery } from "../db/mysqlRunQuery";
import { getActiveSeasonChampionshipIds } from "./season-league-external-id.models";

// Mock the database connection
jest.mock("../db/mysqlRunQuery");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("season-league-external-id.models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getActiveSeasonChampionshipIds", () => {
    it("should return championship IDs for active seasons", async () => {
      // Mock data for active seasons
      const mockResults = [
        { external_id: "active_champ_1", is_round_robin_bo2_as_2xbo1: true },
        { external_id: "active_champ_2", is_round_robin_bo2_as_2xbo1: false }
      ];

      mockRunQuery.mockResolvedValue(mockResults);

      const result = await getActiveSeasonChampionshipIds();

      expect(result).toEqual(mockResults);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE (")
      );
    });

    it("should return championship IDs for seasons in signup period", async () => {
      // Mock data for seasons in signup period
      const mockResults = [
        { external_id: "signup_champ_1", is_round_robin_bo2_as_2xbo1: true }
      ];

      mockRunQuery.mockResolvedValue(mockResults);

      const result = await getActiveSeasonChampionshipIds();

      expect(result).toEqual(mockResults);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "signup_end_date IS NOT NULL AND s.signup_end_date <= NOW() AND s.start_date > NOW()"
        )
      );
    });

    it("should return championship IDs for both active and signup period seasons", async () => {
      // Mock data for both types of seasons
      const mockResults = [
        { external_id: "active_champ_1", is_round_robin_bo2_as_2xbo1: true },
        { external_id: "signup_champ_1", is_round_robin_bo2_as_2xbo1: false },
        { external_id: "active_champ_2", is_round_robin_bo2_as_2xbo1: true }
      ];

      mockRunQuery.mockResolvedValue(mockResults);

      const result = await getActiveSeasonChampionshipIds();

      expect(result).toEqual(mockResults);
      expect(mockRunQuery).toHaveBeenCalledWith(expect.stringContaining("OR"));
    });

    it("should return empty array when no seasons match criteria", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getActiveSeasonChampionshipIds();

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      mockRunQuery.mockRejectedValue(error);

      await expect(getActiveSeasonChampionshipIds()).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
