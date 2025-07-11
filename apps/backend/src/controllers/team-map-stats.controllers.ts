import { type Response } from "express";
import { type RequestWithParams, type ParsedParams } from "@eggosystem/types";
import { getTeamEnhancedMapStats } from "../models/team-map-stats.models";
import { BadRequestError } from "../utils/errors";

/**
 * Controller to get enhanced map statistics for a team
 * Includes CT and T side performance metrics
 */
export const getTeamEnhancedMapStatsController = async (
  req: RequestWithParams<{ teamId: string }>,
  res: Response
): Promise<void> => {
  try {
    const teamId = Number(req.params.teamId);

    if (isNaN(teamId) || teamId <= 0) {
      throw new BadRequestError("Invalid team ID");
    }

    // Get parsed filters from middleware
    const filters = req.parsedParams as ParsedParams;

    // Get enhanced map stats with CT/T side performance
    const mapStats = await getTeamEnhancedMapStats(teamId, filters);

    if (mapStats.length === 0) {
      res.status(404).json({
        message: `No map statistics found for team ${teamId} with the provided filters`
      });
      return;
    }

    res.json(mapStats);
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }

    // Let the error handling middleware handle other errors
    throw new BadRequestError(
      `Failed to get team map statistics: ${(error as Error).message}`
    );
  }
};
