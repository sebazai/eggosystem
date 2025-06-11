import { type Response } from "express";
import { getTeamValuesForSorter } from "../models/sortter.models";
import type { RequestWithParams, TeamSortterValues } from "@eggosystem/types";

/**
 * Controller to get team values for sorter functionality
 * This returns all teams for a given season with their values:
 * - team name
 * - top 5 players kanaelo sum
 * - top 4 players kanaelo average
 * - team league
 * - kanaelo values for top 5 players
 */
export const getTeamValuesController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamValues = await getTeamValuesForSorter(seasonId);
  res.json(teamValues);
};

/**
 * Controller to get team values for a specific team
 * Returns a single team's values for sorter functionality
 */
export const getTeamValueByIdController = async (
  req: RequestWithParams<{ season_id: string; team_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);

  const teamValues = await getTeamValuesForSorter(seasonId);
  const team = teamValues.find(
    (team: TeamSortterValues) => team.team_id === teamId
  );

  if (!team) {
    res.status(404).json({
      message: `Team with ID ${teamId} not found for season ${seasonId}`
    });
    return;
  }

  res.json(team);
};
