import { type Response } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import { getTeamEnhancedMapStats } from "../models/team-map-stats.models";

/**
 * Controller to get enhanced map statistics for a team
 * Includes CT and T side performance metrics
 */
export const getTeamEnhancedMapStatsController = async (
  req: RequestWithParams<{ team_id: string }>,
  res: Response
): Promise<void> => {
  const teamId = Number(req.params.team_id);

  const filters = req.parsedParams;

  const mapStats = await getTeamEnhancedMapStats(teamId, filters);

  if (mapStats.length === 0) {
    res.status(404).json({
      message: `No map statistics found for team ${teamId} with the provided filters`
    });
    return;
  }

  res.json(mapStats);
};
