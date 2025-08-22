import {
  getCSRank,
  getPlayerAppIdRank,
  getPlayerHoursForSteamAppId
} from "./player-ranks.services";
import * as leetifyService from "./leetify.services";
import * as seasonPlayerRanksModels from "../models/season-player-ranks.models";
import { redisClient } from "../utils/redisClient";
import { runQuery } from "../db/mysqlRunQuery";

// Mock all external dependencies
jest.mock("./leetify.services");
jest.mock("./faceit.services");
jest.mock("./steam.services");
jest.mock("../models/season-player-ranks.models");
jest.mock("../utils/redisClient");
jest.mock("../db/mysqlRunQuery");

const mockLeetifyService = leetifyService as jest.Mocked<typeof leetifyService>;
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
  });

  describe("getCSRank", () => {
    const date_now = new Date().toISOString();
    const validRankResponse = {
      average_rank: 15000,
      rank_updated_at: date_now
    };

    describe("Database priority (with season_id)", () => {
      it("should return rank from database when season_id provided and rank exists", async () => {
        mockSeasonPlayerRanksModels.getPlayerRankForSeason.mockResolvedValue({
          average_rank: 15000,
          rank_updated_at: date_now
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
          expect.stringContaining("SELECT cs2_rank, rank_updated_at"),
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

  describe("getRankFromDatabase", () => {
    // Since getRankFromDatabase is a private function, we need to test it through getCSRank
    // with a season_id parameter to trigger the database path

    it("should return rank from database when average_rank exists", async () => {
      const validRankData = {
        average_rank: 15000,
        rank_updated_at: new Date().toISOString()
      };

      mockSeasonPlayerRanksModels.getPlayerRankForSeason.mockResolvedValue(
        validRankData
      );

      const result = await getCSRank(testSteamId, testSeasonId);

      expect(result).toEqual(validRankData);
      expect(
        mockSeasonPlayerRanksModels.getPlayerRankForSeason
      ).toHaveBeenCalledWith(testSteamId, testSeasonId);
    });

    it("should return null when average_rank is 0", async () => {
      const rankDataWithZeroRank = {
        average_rank: 0,
        rank_updated_at: new Date().toISOString()
      };

      mockSeasonPlayerRanksModels.getPlayerRankForSeason.mockResolvedValue(
        rankDataWithZeroRank
      );

      // Should fall back to cache since database returned 0 average_rank
      await getCSRank(testSteamId, testSeasonId);

      expect(
        mockSeasonPlayerRanksModels.getPlayerRankForSeason
      ).toHaveBeenCalledWith(testSteamId, testSeasonId);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        `730-${testSteamId}-rank`
      );
    });

    it("should return null when getPlayerRankForSeason returns undefined", async () => {
      mockSeasonPlayerRanksModels.getPlayerRankForSeason.mockResolvedValue(
        undefined
      );

      // Should fall back to cache since database returned undefined
      await getCSRank(testSteamId, testSeasonId);

      expect(
        mockSeasonPlayerRanksModels.getPlayerRankForSeason
      ).toHaveBeenCalledWith(testSteamId, testSeasonId);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        `730-${testSteamId}-rank`
      );
    });

    it("should return null when rank object exists but average_rank is missing", async () => {
      const rankDataWithoutAverageRank = {
        rank_updated_at: new Date().toISOString()
        // average_rank is missing
      };

      mockSeasonPlayerRanksModels.getPlayerRankForSeason.mockResolvedValue(
        rankDataWithoutAverageRank as {
          average_rank: number;
          rank_updated_at: string;
        }
      );

      // Should fall back to cache since average_rank is missing
      await getCSRank(testSteamId, testSeasonId);

      expect(
        mockSeasonPlayerRanksModels.getPlayerRankForSeason
      ).toHaveBeenCalledWith(testSteamId, testSeasonId);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        `730-${testSteamId}-rank`
      );
    });
  });
});
