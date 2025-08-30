import { type RequestWithParams } from "@eggosystem/types";
import { type Response } from "express";
import { getTeamsForSeason } from "../../models/team.models";
import { checkPlayerAdditionEligibility } from "../../models/dashboard/season.models";

/**
 * Controller to get all teams for a specific season
 * Returns teams with their league information
 */
export const getTeamsForSeasonController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);

  const teams = await getTeamsForSeason(seasonId);
  res.json(teams);
};

/**
 * Controller to check if a player can be added to a team
 * Returns analysis of the player's impact on team balance
 */
export const checkPlayerAdditionEligibilityController = async (
  req: RequestWithParams<{
    season_id: string;
    team_id: string;
    steam_id: string;
  }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);
  const steamId = req.params.steam_id;

  const eligibility = await checkPlayerAdditionEligibility(
    seasonId,
    teamId,
    steamId
  );
  res.json(eligibility);
};
