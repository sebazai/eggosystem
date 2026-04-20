import { getFaceITGameRank, getFaceITCS2Rank } from "./faceit-player.services";
import {
  faceitValidSteamId,
  faceitValidSteamIdDecayed,
  faceitNotFoundSteamId,
  faceitNetworkErrorSteamId,
  faceitInvalidJsonSteamId,
  faceitInvalidGameDataSteamId,
  faceitCs2EmptyMetadataSteamId
} from "@eggosystem/shared-msw";
import { redisClient } from "../utils/redisClient";
import * as seasonPlayerRanksModels from "../models/season-player-ranks.models";

jest.mock("../utils/redisClient");
jest.mock("../models/season-player-ranks.models");

const mockRedisGet = redisClient.get as jest.MockedFunction<
  typeof redisClient.get
>;
const mockGetLatestSeasonForPlayer =
  seasonPlayerRanksModels.getLatestSeasonForPlayer as jest.MockedFunction<
    typeof seasonPlayerRanksModels.getLatestSeasonForPlayer
  >;
const mockGetPlayerExternalRankForSeason =
  seasonPlayerRanksModels.getPlayerExternalRankForSeason as jest.MockedFunction<
    typeof seasonPlayerRanksModels.getPlayerExternalRankForSeason
  >;

describe("getFaceITGameRank", () => {
  it("should return rank data for valid Steam ID", async () => {
    const result = await getFaceITGameRank(faceitValidSteamId, "cs2");

    expect(result).toEqual({
      elo: 1500,
      rank: 7,
      player_id: faceitValidSteamId
    });
  });

  it("should return null for 404 response", async () => {
    const result = await getFaceITGameRank(faceitNotFoundSteamId, "cs2");

    expect(result).toBeNull();
  });

  it("should handle network errors", async () => {
    try {
      await getFaceITGameRank(faceitNetworkErrorSteamId, "cs2");
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as unknown as Error).message).toContain("Failed to fetch");
    }
  });

  it("should handle invalid JSON response", async () => {
    try {
      await getFaceITGameRank(faceitInvalidJsonSteamId, "cs2");
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as unknown as Error).message).toContain("Invalid JSON");
    }
  });

  it("should handle malformed response data", async () => {
    try {
      await getFaceITGameRank(faceitInvalidGameDataSteamId, "cs2");
    } catch (error) {
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(Error);
      expect((error as unknown as Error).message).toBe("Invalid rank data");
    }
  });
});

describe("getFaceITCS2Rank", () => {
  it("should return FaceIT-specific rank data when successful and not decayed", async () => {
    const result = await getFaceITCS2Rank(faceitValidSteamId);

    expect(result).toEqual(
      expect.objectContaining({
        faceit_elo: 1500,
        faceit_level: 7,
        faceit_date: expect.any(Number),
        faceit_kd: 1.35,
        metadata: expect.objectContaining({
          faceit_decay: false,
          faceit_last_match: expect.any(Number),
          faceit_matches_played: 453
        })
      })
    );
  });

  it("should return faceit decayed cs2 rank", async () => {
    const result = await getFaceITCS2Rank(faceitValidSteamIdDecayed);

    expect(result).toEqual(
      expect.objectContaining({
        faceit_elo: 1425,
        faceit_level: 7,
        metadata: expect.objectContaining({
          faceit_decay: true,
          faceit_last_match: expect.any(Number),
          faceit_matches_played: 453
        })
      })
    );
  });

  it("should handle 404 Not Found Error in CS2 rank fetch and return fallback rank", async () => {
    const result = await getFaceITCS2Rank(faceitNotFoundSteamId);

    expect(result).toEqual(
      expect.objectContaining({
        faceit_elo: 750,
        faceit_level: 2,
        faceit_kd: 0.95,
        faceit_date: expect.any(Number),
        metadata: expect.objectContaining({
          faceit_decay: false,
          faceit_last_match: undefined,
          faceit_matches_played: undefined,
          faceit_fallback: true
        })
      })
    );
  });

  it("should handle missing game data", async () => {
    const result = await getFaceITCS2Rank(faceitInvalidGameDataSteamId);

    expect(result).toEqual(
      expect.objectContaining({
        faceit_elo: -1,
        faceit_level: -1,
        faceit_kd: -1,
        faceit_date: expect.any(Number)
      })
    );
  });

  it("should handle extraordinary case: CS2 rank returns data but metadata has empty items array, falling back to CSGO metadata with past date", async () => {
    const result = await getFaceITCS2Rank(faceitCs2EmptyMetadataSteamId);

    expect(result).toEqual(
      expect.objectContaining({
        faceit_elo: 1440,
        faceit_level: 7,
        faceit_date: expect.any(Number),
        faceit_kd: 1.8,
        metadata: expect.objectContaining({
          faceit_decay: true,
          faceit_last_match: expect.any(Number),
          faceit_matches_played: 200
        })
      })
    );

    const threeYearsAgo = new Date(
      new Date().getTime() - 3 * 365 * 24 * 60 * 60 * 1000
    ).getTime();

    expect(result.metadata.faceit_last_match).toBeLessThan(
      new Date().getTime()
    );
    expect(result.metadata.faceit_last_match).toBeCloseTo(threeYearsAgo, -1000);
  });

  describe("skipExternalCheck: true (Redis + DB only, no FaceIT API)", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockRedisGet.mockResolvedValue(null);
      mockGetLatestSeasonForPlayer.mockResolvedValue(null);
      mockGetPlayerExternalRankForSeason.mockResolvedValue(undefined);
    });

    it("should return cached rank when Redis has data and never call FaceIT API", async () => {
      const cachedRank = {
        faceit_level: 6,
        faceit_elo: 1600,
        faceit_kd: 1.1,
        faceit_date: Date.now(),
        metadata: { faceit_decay: false, faceit_fallback: false }
      };
      mockRedisGet.mockResolvedValue(JSON.stringify(cachedRank));

      const result = await getFaceITCS2Rank(faceitValidSteamId, undefined, {
        skipExternalCheck: true
      });

      expect(result).toEqual(
        expect.objectContaining({
          faceit_level: 6,
          faceit_elo: 1600,
          faceit_kd: 1.1
        })
      );
      expect(mockGetPlayerExternalRankForSeason).not.toHaveBeenCalled();
      expect(mockGetLatestSeasonForPlayer).not.toHaveBeenCalled();
    });

    it("should return rank from DB (latest season) when Redis miss and never call FaceIT API", async () => {
      mockGetLatestSeasonForPlayer.mockResolvedValue(5);
      mockGetPlayerExternalRankForSeason.mockResolvedValue({
        faceit_level: 4,
        faceit_elo: 1200,
        faceit_kd: 1.0,
        faceit_date: new Date().getTime()
      });

      const result = await getFaceITCS2Rank(faceitValidSteamId, undefined, {
        skipExternalCheck: true
      });

      expect(result).toEqual(
        expect.objectContaining({
          faceit_level: 4,
          faceit_elo: 1200,
          faceit_kd: 1.0
        })
      );
      expect(mockGetLatestSeasonForPlayer).toHaveBeenCalledWith(
        faceitValidSteamId
      );
      expect(mockGetPlayerExternalRankForSeason).toHaveBeenCalledWith(
        faceitValidSteamId,
        5,
        expect.any(String)
      );
    });

    it("should return no-rank shape when Redis miss and no DB rank, never call FaceIT API", async () => {
      mockGetLatestSeasonForPlayer.mockResolvedValue(1);
      mockGetPlayerExternalRankForSeason.mockResolvedValue(undefined);

      const result = await getFaceITCS2Rank(faceitValidSteamId, undefined, {
        skipExternalCheck: true
      });

      expect(result).toEqual(
        expect.objectContaining({
          faceit_level: -1,
          faceit_elo: -1,
          faceit_kd: -1
        })
      );
      expect(result.metadata).toEqual(
        expect.objectContaining({
          faceit_decay: false,
          faceit_fallback: true
        })
      );
    });
  });
});
