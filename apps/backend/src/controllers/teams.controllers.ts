import { type Request, type Response } from "express";
import {
  getTeams,
  getTeamsByFilters,
  getTeamMatchesByFilters,
  getTeamMapStats,
  getFilteredTopTeams,
  getTeamById,
  getTeamsWithoutOrgs,
  getOneTeamByFilters
} from "../models/team.models";
import type { RequestWithParams } from "@eggosystem/types";
import { NotFoundError } from "../utils/errors";

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
    throw new NotFoundError("Team not found");
  }
  res.json(team);
};

export const getFilteredTeamsController = async (
  req: Request,
  res: Response
) => {
  const { season_ids, league_ids, team_ids } = req.parsedParams;
  const teams = await getTeamsByFilters({
    season_ids,
    league_ids,
    team_ids,
    stages: null,
    map_ids: null
  });
  res.json(teams);
};

export const getFilteredTeamMatchHistoryController = async (
  req: RequestWithParams<{ team_id: string }>,
  res: Response
) => {
  const teamId = Number(req.params.team_id);
  const { season_ids, league_ids, map_ids, stages } = req.parsedParams;

  const result = await getTeamMatchesByFilters({
    team_ids: [teamId],
    season_ids,
    league_ids,
    map_ids,
    stages
  });
  res.json(result);
};

export const getFilteredTeamIdController = async (
  req: RequestWithParams<{ team_id: string }>,
  res: Response
) => {
  const teamId = parseInt(req.params.team_id);
  const { season_ids, league_ids } = req.parsedParams;

  const [team] = await getOneTeamByFilters(teamId, season_ids, league_ids);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  res.json(team);
};

export const getFilteredTeamIdDetailsController = async (
  req: RequestWithParams<{ team_id: string }>,
  res: Response
) => {
  const teamId = parseInt(req.params.team_id);
  const { season_ids, league_ids, map_ids, stages } = req.parsedParams;

  const [team] = await getTeamsByFilters({
    season_ids,
    league_ids,
    team_ids: [teamId],
    map_ids,
    stages
  });

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  res.json(team);
};

export const getFilteredTeamMapStatsController = async (
  req: RequestWithParams<{ team_id: string }>,
  res: Response
) => {
  const teamId = Number(req.params.team_id);
  const map_stats = await getTeamMapStats(teamId, req.parsedParams);
  res.json(map_stats);
};

export const getFilteredTopTeamsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const topTeams = await getFilteredTopTeams(req.parsedParams);

  res.json(topTeams);
};

export const getTeamsWithoutOrgController = async (
  req: Request,
  res: Response
) => {
  const teams = await getTeamsWithoutOrgs();
  res.json(teams);
};
