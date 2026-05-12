import type { Response, NextFunction } from "express";
import type { Request } from "express";
import {
  getCachedGameWidePublicSponsorsByGameId,
  getCachedGroupedPublicSponsors
} from "../services/marketing-sponsors.services";
import { getGameByAbbreviationCi } from "../models/game.models";
import { BadRequestError, NotFoundError } from "../utils/errors";

/**
 * GET /api/v1/sponsors — public, grouped marketing sponsors for frontpage/footer.
 */
export const getPublicMarketingSponsorsController = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const data = await getCachedGroupedPublicSponsors();
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json(data);
};

/**
 * GET /api/v1/sponsors/games/:game_abbreviation — enabled `game_wide` sponsors for a game (case-insensitive abbreviation).
 */
export const getPublicGameWideMarketingSponsorsByAbbrevController = async (
  req: Request<{ game_abbreviation: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const raw = req.params.game_abbreviation;
  if (!raw?.trim()) {
    return next(new BadRequestError("game_abbreviation is required"));
  }
  const game = await getGameByAbbreviationCi(raw);
  if (!game) {
    return next(new NotFoundError("Game not found"));
  }
  const sponsors = await getCachedGameWidePublicSponsorsByGameId(game.id);
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({ sponsors });
};
