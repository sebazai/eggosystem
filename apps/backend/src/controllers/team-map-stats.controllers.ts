import { type Response, type NextFunction } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import { getTeamEnhancedMapStats } from "../models/team-map-stats.models";
import { getTeamTradeMapStats } from "../models/team.models";
import { NotFoundError } from "../utils/errors";

/**
 * Controller to get enhanced map statistics for a team
 * Includes CT and T side performance metrics
 */
export const getTeamEnhancedMapStatsController = async (
  req: RequestWithParams<{ team_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const teamId = Number(req.params.team_id);

  const filters = req.parsedParams;

  const mapStats = await getTeamEnhancedMapStats(teamId, filters);

  if (mapStats.length === 0) {
    return next(
      new NotFoundError(
        `No map statistics found for team ${teamId} with the provided filters`
      )
    );
  }

  res.json(mapStats);
};

/**
 * Controller to get trade statistics for a team, grouped by map
 * Aggregates trades, trade_attempts, and trade_opportunities from PlayerStats
 */
export const getTeamTradeMapStatsController = async (
  req: RequestWithParams<{ team_id: string }>,
  res: Response
): Promise<void> => {
  const teamId = Number(req.params.team_id);
  const filters = req.parsedParams;

  const tradeStats = await getTeamTradeMapStats(teamId, filters);

  res.status(200).json({
    success: true,
    data: tradeStats
  });
};
