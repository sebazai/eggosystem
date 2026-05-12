import { runQuery } from "../db/mysqlRunQuery";
import { getOngoingFaceitCSSeasonChampionshipIds } from "./season-league-external-id.models";

// Mock the database connection
jest.mock("../db/mysqlRunQuery");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("season-league-external-id.models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getOngoingFaceitCSSeasonChampionshipIds", () => {
    it("should return championship IDs for ongoing CS2 FACEIT seasons", async () => {
      const mockResults = [
        { external_id: "active_champ_1", is_round_robin_bo2_as_2xbo1: true },
        { external_id: "active_champ_2", is_round_robin_bo2_as_2xbo1: false }
      ];

      mockRunQuery.mockResolvedValue(mockResults);

      const result = await getOngoingFaceitCSSeasonChampionshipIds();

      expect(result).toEqual(mockResults);
    });

    it("should scope query to FACEIT platform only", async () => {
      mockRunQuery.mockResolvedValue([]);

      await getOngoingFaceitCSSeasonChampionshipIds();

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("s.platform = 'faceit'")
      );
    });

    it("should scope query to CS2 game (game_id = 730)", async () => {
      mockRunQuery.mockResolvedValue([]);

      await getOngoingFaceitCSSeasonChampionshipIds();

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("s.game_id = 730")
      );
    });

    it("should include seasons currently running (between start_date and end_date)", async () => {
      mockRunQuery.mockResolvedValue([]);

      await getOngoingFaceitCSSeasonChampionshipIds();

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW())"
        )
      );
    });

    it("should include seasons in signup period (signup open, not yet started)", async () => {
      mockRunQuery.mockResolvedValue([]);

      await getOngoingFaceitCSSeasonChampionshipIds();

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "signup_end_date IS NOT NULL AND s.signup_end_date <= NOW() AND s.start_date > NOW()"
        )
      );
    });

    it("should return empty array when no CS2 FACEIT seasons are active or in signup", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getOngoingFaceitCSSeasonChampionshipIds();

      expect(result).toEqual([]);
    });

    it("should propagate database errors", async () => {
      const error = new Error("Database connection failed");
      mockRunQuery.mockRejectedValue(error);

      await expect(getOngoingFaceitCSSeasonChampionshipIds()).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
