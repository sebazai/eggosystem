import {
  getFaceITGameRank,
  getFaceITCS2Rank
} from "../../services/faceit.services";
import {
  faceitValidSteamId,
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
      const result = await getFaceITGameRank(faceitNetworkErrorSteamId, "cs2");

      expect(result).toBeNull();
    });

    it("should handle invalid JSON response", async () => {
      const result = await getFaceITGameRank(faceitInvalidJsonSteamId, "cs2");
      expect(result).toBeNull();
    });

    it("should handle malformed response data", async () => {
      const result = await getFaceITGameRank(
        faceitInvalidGameDataSteamId,
        "cs2"
      );

      expect(result).toEqual(null);
    });
  });

  describe("getFaceITCS2Rank", () => {
    it("should return FaceIT-specific rank data when successful", async () => {
      const result = await getFaceITCS2Rank(faceitValidSteamId);

      expect(result).toEqual(
        expect.objectContaining({
          faceit_elo: 1500,
          faceit_level: 7,
          faceit_date: expect.any(Number),
          faceit_kd: 1.2,
          metadata: expect.objectContaining({
            faceit_decay: false,
            faceit_last_match: new Date("2024-01-01T00:00:00Z").getTime(),
            faceit_matches_played: 100
          })
        })
      );
    });

    it("should handle Error in CS2 rank fetch", async () => {
      const result = await getFaceITCS2Rank(faceitNotFoundSteamId);

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
