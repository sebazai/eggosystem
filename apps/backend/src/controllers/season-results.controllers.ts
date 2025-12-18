import type { Request, Response } from "express";
import type { SeasonResultsResponse } from "@eggosystem/types";
import {
  getSeasonResultsForSeason,
  getSeasonsWithPlacements,
  getSeasonNameById
} from "../models/season-results.models";

/**
 * Get Season Results for a specific season
 * Returns top 3 teams per division for the given season
 */
export const getSeasonResultsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const seasonId = parseInt(req.query.season_id as string);

  if (!seasonId || isNaN(seasonId)) {
    res.status(400).json({
      error: "season_id query parameter is required and must be a number"
    });
    return;
  }

  const seasonName = await getSeasonNameById(seasonId);

  if (!seasonName) {
    res.status(404).json({
      error: `Season ${seasonId} not found`
    });
    return;
  }

  const divisions = await getSeasonResultsForSeason(seasonId);

  const response: SeasonResultsResponse = {
    season_id: seasonId,
    season_name: seasonName,
    divisions
  };

  res.json(response);
};

/**
 * Get list of seasons that have placements (for dropdown selector)
 */
export const getSeasonsWithPlacementsController = async (
  _req: Request,
  res: Response
) => {
  const seasons = await getSeasonsWithPlacements();
  res.json(seasons);
};
