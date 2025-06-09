import {
  getFaceITGameRank,
  getFaceITCS2Rank
} from "../../services/faceit.services";

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, "log").mockImplementation(),
  warn: jest.spyOn(console, "warn").mockImplementation(),
  error: jest.spyOn(console, "error").mockImplementation()
};

describe("FaceIT Services", () => {
  const testSteamId = "76561198000000000";
  const testFaceitId = "test-faceit-id";

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(consoleSpy).forEach((spy) => spy.mockClear());
  });

  afterAll(() => {
    Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
  });

  describe("getFaceITGameRank", () => {
    it("should return rank data for valid Steam ID", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          games: {
            cs2: {
              faceit_elo: 1500,
              skill_level: 7
            }
          },
          player_id: testFaceitId
        })
      } as Response);

      const result = await getFaceITGameRank(testSteamId, "cs2");

      expect(result).toEqual({
        elo: 1500,
        rank: 7,
        player_id: testFaceitId
      });
      expect(mockFetch).toHaveBeenCalledWith(
        `https://open.faceit.com/data/v4/players?game=cs2&game_player_id=${testSteamId}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
            "User-Agent": "Kanaliiga-Eggosystem/1.0"
          }),
          signal: expect.any(AbortSignal)
        })
      );
    });

    it("should return null for 404 response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found"
      } as Response);

      const result = await getFaceITGameRank(testSteamId, "cs2");

      expect(result).toBeNull();
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await getFaceITGameRank(testSteamId, "cs2");

      expect(result).toBeNull();
    });

    it("should handle malformed response data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ games: { cs2: { invalid: "data" } } })
      } as Response);

      const result = await getFaceITGameRank(testSteamId, "cs2");

      // The service returns an object with NaN values rather than null for malformed data
      expect(result).toEqual({
        elo: NaN,
        rank: NaN,
        player_id: undefined
      });
    });
  });

  describe("getFaceITCS2Rank", () => {
    it("should return FaceIT-specific rank data when successful", async () => {
      // Mock both the player data fetch and the stats fetch
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            games: {
              cs2: {
                faceit_elo: 1500,
                skill_level: 7
              }
            },
            player_id: testFaceitId
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            lifetime: {
              "Average K/D Ratio": "1.2",
              Matches: "100"
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                stats: {
                  "Created At": "2024-01-01T00:00:00Z"
                }
              }
            ]
          })
        } as Response);

      const result = await getFaceITCS2Rank(testSteamId);

      expect(result).toEqual(
        expect.objectContaining({
          faceit_elo: expect.any(Number),
          faceit_level: expect.any(Number),
          faceit_date: expect.any(Number),
          faceit_kd: expect.any(Number),
          metadata: expect.objectContaining({
            faceit_decay: expect.any(Boolean),
            faceit_last_match: expect.any(Number),
            faceit_matches_played: expect.any(Number)
          })
        })
      );
    });

    it("should handle Error in CS2 rank fetch", async () => {
      const error = new Error("This operation was aborted");
      mockFetch.mockRejectedValue(error);

      const result = await getFaceITCS2Rank(testSteamId);

      // When FaceIT API times out, it returns default values with -1
      expect(result).toEqual(
        expect.objectContaining({
          faceit_elo: -1,
          faceit_level: -1,
          faceit_kd: -1,
          faceit_date: expect.any(Number)
        })
      );
    });

    it("should handle missing game data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ games: {} }) // No cs2 data
      } as Response);

      const result = await getFaceITCS2Rank(testSteamId);

      // When no game data is found, returns default values with -1
      expect(result).toEqual(
        expect.objectContaining({
          faceit_elo: -1,
          faceit_level: -1,
          faceit_kd: -1,
          faceit_date: expect.any(Number)
        })
      );
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error"
      } as Response);

      const result = await getFaceITCS2Rank(testSteamId);

      // When API returns errors, returns default values with -1
      expect(result).toEqual(
        expect.objectContaining({
          faceit_elo: -1,
          faceit_level: -1,
          faceit_kd: -1,
          faceit_date: expect.any(Number)
        })
      );
    });
  });
});
