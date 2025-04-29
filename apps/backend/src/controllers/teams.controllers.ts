import { type Request, type Response } from "express";
import {
  getTeams,
  getTeamsByFilters,
  getTeamDetailsById,
  getTeamPlayers,
  getTeamMatches,
  getTeamMapStats,
  getTopTeams,
  getTeamById,
  getTeamsWithoutOrgs
} from "../models/team.models";
import type { RequestWithParams } from "@eggosystem/types";

export const getAllTeams = async (req: Request, res: Response) => {
  const allTeams = await getTeams();
  res.json(allTeams);
};

export const getTeamByIdController = async (
  req: RequestWithParams<{ teamId: string }>,
  res: Response
) => {
  const teamIdNumber = Number(req.params.teamId);
  const [team] = await getTeamById(teamIdNumber);
  if (!team) {
    res.status(404).json("Team not found");
  }
  res.json(team);
};

export const getTeamsByFiltersController = async (
  req: Request,
  res: Response
) => {
  const { season_ids, league_ids, team_ids } = req.parsedParams;
  const teams = await getTeamsByFilters(season_ids, league_ids, team_ids);
  res.json(teams);
};

export const getTeamDetailsController = async (
  req: RequestWithParams<{ teamId: string }>,
  res: Response
) => {
  const teamId = parseInt(req.params.teamId);
  const { season_ids, map_ids } = req.parsedParams;

  const team = await getTeamDetailsById(teamId, season_ids);

  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const [players, matches, map_stats] = await Promise.all([
    getTeamPlayers(teamId, season_ids, map_ids),
    getTeamMatches(teamId, season_ids, map_ids),
    getTeamMapStats(teamId, season_ids, map_ids)
  ]);

  res.json({
    team,
    players,
    matches,
    map_stats
  });
};

export const getTopTeamsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const topTeams = await getTopTeams(req.parsedParams);

  res.json(topTeams);
};

export const getTeamsWithoutOrgController = async (
  req: Request,
  res: Response
) => {
  const teams = await getTeamsWithoutOrgs();
  res.json(teams);
};
