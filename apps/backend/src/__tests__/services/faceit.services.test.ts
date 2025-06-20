import {
  getFaceITGameRank,
  getFaceITCS2Rank
} from "../../services/faceit.services";
import {
  faceitValidSteamId,
  faceitValidSteamIdDecayed,
  faceitNotFoundSteamId,
  faceitNetworkErrorSteamId,
  faceitInvalidJsonSteamId,
  faceitInvalidGameDataSteamId
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
  });
});
