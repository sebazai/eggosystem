import {
  getCSRank,
  getPlayerAppIdRank,
  getPlayerHoursForSteamAppId
} from "../../services/player-ranks.services";
import * as leetifyService from "../../services/leetify.services";
import * as faceitService from "../../services/faceit.services";
import * as steamService from "../../services/steam.services";
import * as seasonPlayerRanksModels from "../../models/season-player-ranks.models";
import { redisClient } from "../../utils/redisClient";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock all external dependencies
jest.mock("../../services/leetify.services");
jest.mock("../../services/faceit.services");
jest.mock("../../services/steam.services");
jest.mock("../../models/season-player-ranks.models");
jest.mock("../../utils/redisClient");
jest.mock("../../db/mysqlRunQuery");

const mockLeetifyService = leetifyService as jest.Mocked<typeof leetifyService>;
const _mockFaceitService = faceitService as jest.Mocked<typeof faceitService>;
const _mockSteamService = steamService as jest.Mocked<typeof steamService>;
const mockSeasonPlayerRanksModels = seasonPlayerRanksModels as jest.Mocked<
  typeof seasonPlayerRanksModels
>;
const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("Player Ranks Services", () => {
  const testSteamId = "76561198000000000";
  const testSeasonId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "warn").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  describe("getCSRank", () => {
    const validRankResponse = {
      average_rank: 15000,
      rank_updated_at: "2024-01-01T00:00:00Z"
    };

    describe("Database priority (with season_id)", () => {
      it("should return rank from database when season_id provided and rank exists", async () => {
        mockSeasonPlayerRanksModels.getPlayerRankForSeason.mockResolvedValue({
          average_rank: 15000,
          rank_updated_at: "2024-01-01T00:00:00Z"
        });

        const result = await getCSRank(testSteamId, testSeasonId);

        expect(result).toEqual(validRankResponse);
        expect(
          mockSeasonPlayerRanksModels.getPlayerRankForSeason
        ).toHaveBeenCalledWith(testSteamId, testSeasonId);
        expect(mockRedisClient.get).not.toHaveBeenCalled();
        expect(mockLeetifyService.getCS2RankFromLeetify).not.toHaveBeenCalled();
      });

      it("should fall back to cache when database returns null", async () => {
        mockSeasonPlayerRanksModels.getPlayerRankForSeason.mockResolvedValue(
          undefined
        );
        mockRedisClient.get.mockResolvedValue(
          JSON.stringify(validRankResponse)
        );

        const result = await getCSRank(testSteamId, testSeasonId);

        expect(result).toEqual(validRankResponse);
        expect(
          mockSeasonPlayerRanksModels.getPlayerRankForSeason
        ).toHaveBeenCalledWith(testSteamId, testSeasonId);
        expect(mockRedisClient.get).toHaveBeenCalledWith(
          `730-${testSteamId}-rank`
        );
      });
    });

    describe("Cache handling", () => {
      it("should return cached rank when available", async () => {
        mockRedisClient.get.mockResolvedValue(
          JSON.stringify(validRankResponse)
        );

        const result = await getCSRank(testSteamId);

        expect(result).toEqual(validRankResponse);
        expect(mockRedisClient.get).toHaveBeenCalledWith(
          `730-${testSteamId}-rank`
        );
        expect(mockLeetifyService.getCS2RankFromLeetify).not.toHaveBeenCalled();
      });

      it("should fall back to external API when cache is empty", async () => {
        mockRedisClient.get.mockResolvedValue(null);
        mockLeetifyService.getCS2RankFromLeetify.mockResolvedValue(
          validRankResponse
        );
        mockRedisClient.set.mockResolvedValue("OK");

        const result = await getCSRank(testSteamId);

        expect(result).toEqual(validRankResponse);
        expect(mockLeetifyService.getCS2RankFromLeetify).toHaveBeenCalledWith(
          testSteamId
        );
        expect(mockRedisClient.set).toHaveBeenCalledWith(
          `730-${testSteamId}-rank`,
          JSON.stringify(validRankResponse),
          "EX",
          expect.any(Number)
        );
      });
    });

    describe("External API handling", () => {
      beforeEach(() => {
        mockRedisClient.get.mockResolvedValue(null);
        mockSeasonPlayerRanksModels.getPlayerRankForSeason.mockResolvedValue(
          undefined
        );
      });

      it("should fetch from Leetify and cache result when successful", async () => {
        mockLeetifyService.getCS2RankFromLeetify.mockResolvedValue(
          validRankResponse
        );
        mockRedisClient.set.mockResolvedValue("OK");

        const result = await getCSRank(testSteamId);

        expect(result).toEqual(validRankResponse);
        expect(mockLeetifyService.getCS2RankFromLeetify).toHaveBeenCalledWith(
          testSteamId
        );
        expect(mockRedisClient.set).toHaveBeenCalledWith(
          `730-${testSteamId}-rank`,
          JSON.stringify(validRankResponse),
          "EX",
          expect.any(Number)
        );
      });

      it("should fall back to database when Leetify returns undefined", async () => {
        mockLeetifyService.getCS2RankFromLeetify.mockResolvedValue(undefined);
        mockRunQuery.mockResolvedValue([
          { cs2_rank: 12000, rank_updated_at: "2024-01-01T00:00:00Z" }
        ]);

        const result = await getCSRank(testSteamId);

        expect(result.average_rank).toEqual(12000);
        expect(mockRunQuery).toHaveBeenCalledWith(
          expect.stringContaining(
            "SELECT cs2_rank, rank_updated_at FROM SeasonPlayerRanks"
          ),
          [testSteamId]
        );
      });
    });

    describe("Database fallback", () => {
      beforeEach(() => {
        mockRedisClient.get.mockResolvedValue(null);
        mockSeasonPlayerRanksModels.getPlayerRankForSeason.mockResolvedValue(
          undefined
        );
        mockLeetifyService.getCS2RankFromLeetify.mockResolvedValue(undefined);
      });

      it("should calculate average from historical data", async () => {
        const historicalData = [
          { cs2_rank: 15000, rank_updated_at: "2024-01-01T00:00:00Z" },
          { cs2_rank: 16000, rank_updated_at: "2024-02-01T00:00:00Z" }
        ];
        mockRunQuery.mockResolvedValue(historicalData);
        mockRedisClient.set.mockResolvedValue("OK");

        const result = await getCSRank(testSteamId);

        expect(result.average_rank).toEqual(15500); // Average of 15000 and 16000
        expect(result.rank_updated_at).toEqual("2024-02-01T00:00:00Z"); // Latest timestamp
      });

      it("should return -1 when no historical data exists", async () => {
        mockRunQuery.mockResolvedValue([]);

        const result = await getCSRank(testSteamId);

        expect(result.average_rank).toEqual(-1);
        expect(result.rank_updated_at).toBeNull();
      });
    });

    describe("Error handling", () => {
      beforeEach(() => {
        mockRedisClient.get.mockResolvedValue(null);
        mockSeasonPlayerRanksModels.getPlayerRankForSeason.mockResolvedValue(
          undefined
        );
      });

      it("should return -1 when Leetify service throws error", async () => {
        mockLeetifyService.getCS2RankFromLeetify.mockRejectedValue(
          new Error("Network timeout")
        );
        mockRunQuery.mockResolvedValue([]);

        const result = await getCSRank(testSteamId);

        expect(result.average_rank).toEqual(-1);
        expect(result.rank_updated_at).toBeNull();
      });

      it("should return -1 when database query fails", async () => {
        mockLeetifyService.getCS2RankFromLeetify.mockResolvedValue(undefined);
        mockRunQuery.mockRejectedValue(new Error("Database error"));

        const result = await getCSRank(testSteamId);

        expect(result.average_rank).toEqual(-1);
        expect(result.rank_updated_at).toBeNull();
      });

      it("should return -1 when Redis operations fail", async () => {
        mockRedisClient.get.mockRejectedValue(
          new Error("Redis connection error")
        );
        mockLeetifyService.getCS2RankFromLeetify.mockResolvedValue(undefined);
        mockRunQuery.mockResolvedValue([]);

        const result = await getCSRank(testSteamId);

        expect(result.average_rank).toEqual(-1);
        expect(result.rank_updated_at).toBeNull();
      });
    });
  });

  describe("getPlayerAppIdRank", () => {
    it("should call getCSRank for CS2 (app_id 730)", async () => {
      const validRankResponse = {
        average_rank: 15000,
        rank_updated_at: "2024-01-01T00:00:00Z"
      };
      mockRedisClient.get.mockResolvedValue(
        JSON.stringify({
          average_rank: 15000,
          rank_updated_at: "2024-01-01T00:00:00Z"
        })
      );

      const result = await getPlayerAppIdRank(testSteamId, 730, testSeasonId);

      expect(result).toEqual(validRankResponse);
    });

    it("should throw BadRequestError for unknown app_id", async () => {
      await expect(getPlayerAppIdRank(testSteamId, 999)).rejects.toThrow(
        "Unknown app_id"
      );
    });
  });

  describe("getPlayerHoursForSteamAppId", () => {
    it("should return hours for CS2 (app_id 730)", async () => {
      const expectedHours = { hours: 1500 };
      mockRedisClient.get.mockResolvedValue("1500");

      const result = await getPlayerHoursForSteamAppId(testSteamId, 730);

      expect(result).toEqual(expectedHours);
    });

    it("should throw BadRequestError for unknown app_id", async () => {
      await expect(
        getPlayerHoursForSteamAppId(testSteamId, 999)
      ).rejects.toThrow("Unknown app_id");
    });
  });

  describe("Performance and logging", () => {
    it("should complete rank lookup within reasonable time", async () => {
      mockRedisClient.get.mockResolvedValue(
        JSON.stringify({
          average_rank: 15000,
          rank_updated_at: "2024-01-01T00:00:00Z"
        })
      );

      const startTime = Date.now();
      await getCSRank(testSteamId);
      const duration = Date.now() - startTime;

      // Should complete quickly when cached
      expect(duration).toBeLessThan(100);
    });
  });
});
