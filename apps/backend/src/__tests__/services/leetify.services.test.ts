import { getCS2RankFromLeetify } from "../../services/leetify.services";

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock logger instead of console
jest.mock("../../utils/app-logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

import { logger } from "../../utils/app-logger";
const mockLogger = logger as jest.Mocked<typeof logger>;

describe("Leetify Services", () => {
  const testSteamId = "76561198000000000";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCS2RankFromLeetify", () => {
    const validLeetifyResponse = {
      games: [
        {
          dataSource: "matchmaking" as const,
          rankType: 11,
          skillLevel: 15000,
          isCs2: true,
          gameFinishedAt: new Date().toISOString() // Current date to pass the year filter
        }
      ]
    };

    it("should return rank data for valid Steam ID", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => validLeetifyResponse
      } as Response);

      const result = await getCS2RankFromLeetify(testSteamId);

      expect(result).toEqual({
        average_rank: 15000,
        rank_updated_at: expect.any(String)
      });
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.cs-prod.leetify.com/api/profile/id/${testSteamId}`,
        expect.objectContaining({
          headers: {
            "User-Agent": "Kanaliiga-Eggosystem/1.0"
          },
          signal: expect.any(AbortSignal)
        })
      );
    });

    it("should handle 404 not found response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found"
      } as Response);

      const result = await getCS2RankFromLeetify(testSteamId);

      expect(result).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `[Leetify] API returned 404 Not Found for steam_id: ${testSteamId}`
        )
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await getCS2RankFromLeetify(testSteamId);

      expect(result).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `[Leetify] Request failed for steam_id: ${testSteamId}`
        ),
        expect.any(Error)
      );
    });

    it("should handle malformed JSON response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("Invalid JSON");
        }
      } as unknown as Response);

      const result = await getCS2RankFromLeetify(testSteamId);

      expect(result).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `[Leetify] Request failed for steam_id: ${testSteamId}`
        ),
        expect.any(Error)
      );
    });

    it("should handle response with no valid games", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ games: [] })
      } as Response);

      const result = await getCS2RankFromLeetify(testSteamId);

      expect(result).toBeUndefined();
    });

    it("should handle response with invalid game data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          games: [
            {
              dataSource: "faceit",
              rankType: null,
              skillLevel: null,
              elo: 1500,
              isCs2: true,
              gameFinishedAt: "2024-01-01T00:00:00Z"
            }
          ]
        })
      } as Response);

      const result = await getCS2RankFromLeetify(testSteamId);

      expect(result).toBeUndefined();
    });

    it("should handle rate limiting (429 status)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests"
      } as Response);

      const result = await getCS2RankFromLeetify(testSteamId);

      expect(result).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `[Leetify] API returned 429 Too Many Requests for steam_id: ${testSteamId}`
        )
      );
    });

    it("should handle server errors (5xx status)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error"
      } as Response);

      const result = await getCS2RankFromLeetify(testSteamId);

      expect(result).toBeUndefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `[Leetify] API returned 500 Internal Server Error for steam_id: ${testSteamId}`
        )
      );
    });

    it("should calculate average rank from multiple games", async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const multipleGamesResponse = {
        games: [
          {
            dataSource: "matchmaking" as const,
            rankType: 11,
            skillLevel: 15000,
            isCs2: true,
            gameFinishedAt: now.toISOString() // Latest
          },
          {
            dataSource: "matchmaking" as const,
            rankType: 11,
            skillLevel: 17000,
            isCs2: true,
            gameFinishedAt: yesterday.toISOString()
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => multipleGamesResponse
      } as Response);

      const result = await getCS2RankFromLeetify(testSteamId);

      expect(result).toEqual({
        average_rank: 16000, // Average of 15000 and 17000
        rank_updated_at: now.toISOString() // Latest game
      });
    });
  });
});
