import { getFaceITGameRank, getFaceITCS2Rank } from "./faceit.services";
import {
  faceitValidSteamId,
  faceitValidSteamIdDecayed,
  faceitNotFoundSteamId,
  faceitNetworkErrorSteamId,
  faceitInvalidJsonSteamId,
  faceitInvalidGameDataSteamId,
  faceitCs2EmptyMetadataSteamId
} from "@eggosystem/shared-msw";

describe("FaceIT Services", () => {
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
        expect((error as unknown as Error).message).toContain(
          "Failed to fetch"
        );
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
          faceit_kd: 1.2,
          metadata: expect.objectContaining({
            faceit_decay: false,
            faceit_last_match: expect.any(Number),
            faceit_matches_played: 100
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

    it("should handle extraordinary case: CS2 rank returns data but metadata has empty items array, falling back to CSGO metadata with past date", async () => {
      const result = await getFaceITCS2Rank(faceitCs2EmptyMetadataSteamId);

      // The CS2 rank should be returned with CSGO metadata (fallback)
      // Since the CSGO metadata has a date 3 years in the past, decay should be applied
      expect(result).toEqual(
        expect.objectContaining({
          faceit_elo: 1440, // Original CS2 elo (1800) with 20% decay (3 years = 36 months)
          faceit_level: 7, // Level 7 corresponds to elo 1440 (1351-1530 range)
          faceit_date: expect.any(Number),
          faceit_kd: 1.8, // From CSGO metadata
          metadata: expect.objectContaining({
            faceit_decay: true, // Decay applied since it's 3 years in the past
            faceit_last_match: expect.any(Number), // Past date from CSGO metadata
            faceit_matches_played: 200 // From CSGO metadata
          })
        })
      );

      // Verify the last match date is in the past (3 years ago)
      const threeYearsAgo = new Date(
        new Date().getTime() - 3 * 365 * 24 * 60 * 60 * 1000
      ).getTime();

      expect(result.metadata.faceit_last_match).toBeLessThan(
        new Date().getTime()
      );
      expect(result.metadata.faceit_last_match).toBeCloseTo(
        threeYearsAgo,
        -1000
      ); // Within 1 second tolerance
    });
  });
});
