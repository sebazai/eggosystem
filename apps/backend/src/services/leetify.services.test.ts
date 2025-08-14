import { getCS2RankFromLeetify } from "./leetify.services";
import {
  leetifyValidSteamId,
  leetifyNotFoundSteamId,
  leetifyNetworkErrorSteamId,
  leetifyInvalidJsonSteamId,
  leetifyNoPremierRankSteamId,
  leetifyInvalidGameDataSteamId,
  leetifyRateLimitSteamId,
  leetifyMultipleGamesSteamId
} from "@eggosystem/shared-msw";

describe("Leetify Services", () => {
  describe("getCS2RankFromLeetify", () => {
    it("should return rank data for valid Steam ID", async () => {
      const result = await getCS2RankFromLeetify(leetifyValidSteamId);

      expect(result).toEqual({
        average_rank: 15000,
        rank_updated_at: expect.any(String)
      });
    });

    it("should handle 404 not found response", async () => {
      const result = await getCS2RankFromLeetify(leetifyNotFoundSteamId);
      expect(result).toBeUndefined();
    });

    it("should handle network errors", async () => {
      const result = await getCS2RankFromLeetify(leetifyNetworkErrorSteamId);
      expect(result).toBeUndefined();
    });

    it("should handle malformed JSON response", async () => {
      const result = await getCS2RankFromLeetify(leetifyInvalidJsonSteamId);
      expect(result).toBeUndefined();
    });

    it("should handle response with no valid games", async () => {
      const result = await getCS2RankFromLeetify(leetifyNoPremierRankSteamId);
      expect(result).toBeUndefined();
    });

    it("should handle response with invalid game data", async () => {
      const result = await getCS2RankFromLeetify(leetifyInvalidGameDataSteamId);

      expect(result).toBeUndefined();
    });

    it("should handle rate limiting (429 status)", async () => {
      const result = await getCS2RankFromLeetify(leetifyRateLimitSteamId);
      expect(result).toBeUndefined();
    });

    it("should calculate average rank from multiple games", async () => {
      const result = await getCS2RankFromLeetify(leetifyMultipleGamesSteamId);

      expect(result).toEqual({
        average_rank: 16000, // Average of 15000 and 17000
        rank_updated_at: expect.any(String)
      });
    });
  });
});
