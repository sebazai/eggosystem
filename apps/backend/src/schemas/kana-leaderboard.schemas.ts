import { z } from "zod";
import { KANA_TIERS } from "@eggosystem/types";

/**
 * Query schema for GET /v1/kana-leaderboard.
 *
 * `tier` is optional; when present it must be one of the known kana tiers
 * (broad groupings or sub-ranks). An empty string is treated as "no filter".
 */
export const kanaLeaderboardQuerySchema = z.object({
  tier: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(KANA_TIERS).optional()
  )
});
