import { type Request, type Response } from "express";
import { type KanaLeaderboardResponse } from "@eggosystem/types";
import { getKanaLeaderboard } from "../services/kana-leaderboard.services";
import { kanaLeaderboardQuerySchema } from "../schemas/kana-leaderboard.schemas";
import { BadRequestError } from "../utils/errors";

/**
 * GET /v1/kana-leaderboard
 *
 * Returns the global top-50 players by live kana elo (highest first), each with
 * their 1-based global position and kana rank tier. An optional `?tier` query
 * param filters the list to a single tier without changing positions.
 */
export const getKanaLeaderboardController = async (
  req: Request,
  res: Response<KanaLeaderboardResponse>
): Promise<void> => {
  const parsed = kanaLeaderboardQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new BadRequestError(
      parsed.error.issues[0]?.message ?? "Invalid tier query parameter"
    );
  }

  const result = await getKanaLeaderboard(parsed.data.tier);

  res.status(200).json(result);
};
