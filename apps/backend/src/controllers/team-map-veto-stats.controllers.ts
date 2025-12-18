import { type Response, type NextFunction } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import { getTeamMapVetoStats } from "../models/team-map-veto-stats.models";

/**
 * Controller to get aggregated map veto statistics for a team (picks and bans)
 */
export const getTeamMapVetoStatsController = async (
  req: RequestWithParams<{ team_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teamId = Number(req.params.team_id);
    const filters = req.parsedParams;

    const vetoStats = await getTeamMapVetoStats(teamId, filters);

    // Return empty array if no data (not an error)
    res.json(vetoStats);
  } catch (error) {
    next(error);
  }
};
