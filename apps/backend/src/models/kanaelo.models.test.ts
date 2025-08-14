import { getAllRegisteredPlayersForSeason } from "./kanaelo.models";
import { runQuery } from "../db/mysqlRunQuery";

// Mock the database query function
jest.mock("../db/mysqlRunQuery");

describe("Kanaelo Models", () => {
  const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllPlayersForSeason", () => {
    it("should return an array of steam IDs for a season", async () => {
      const mockPlayers = [
        { steam_id: "76561197963921578" },
        { steam_id: "76561197967885016" },
        { steam_id: "76561198001857963" }
      ];

      mockRunQuery.mockResolvedValue(mockPlayers);

      const result = await getAllRegisteredPlayersForSeason(1);

      expect(mockRunQuery).toHaveBeenCalledWith(expect.any(String), [1]);
      expect(result).toEqual([
        "76561197963921578",
        "76561197967885016",
        "76561198001857963"
      ]);
    });

    it("should return an empty array if no players found", async () => {
      mockRunQuery.mockResolvedValue([]);

      const result = await getAllRegisteredPlayersForSeason(999);

      expect(mockRunQuery).toHaveBeenCalledWith(expect.any(String), [999]);
      expect(result).toEqual([]);
    });

    it("should handle database errors properly", async () => {
      const dbError = new Error("Database connection failed");
      mockRunQuery.mockRejectedValue(dbError);

      await expect(getAllRegisteredPlayersForSeason(1)).rejects.toThrow(
        dbError
      );
      expect(mockRunQuery).toHaveBeenCalledWith(expect.any(String), [1]);
    });
  });
});
