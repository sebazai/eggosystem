import { type Response } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import { getMatchGamesByTeam } from "../models/match.models";
import { getLeaguesBySeason } from "../models/league.models";
import {
  getTeamKeyPlayers,
  getTeamPlayers,
  getTeamsByLeague
} from "../models/team.models";
import { getPlayerStatsWithAllFilters } from "../models/player.models";
import { getActiveMapPoolMaps } from "../models/season-active-map-pool.models";

export const getMatchGamesByTeamController = async (
  req: RequestWithParams<{ team_id: string; season_id: string }>,
  res: Response
) => {
  const teamIdNumber = Number(req.params.team_id);
  const seasonId = Number(req.params.season_id);
  const matchGames = await getMatchGamesByTeam(teamIdNumber, seasonId);
  res.json(matchGames);
};

export const getLeaguesBySeasonController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
) => {
  const seasonIdNumber = Number(req.params.season_id);
  const leagues = await getLeaguesBySeason(seasonIdNumber);
  res.json(leagues);
};

export const getSeasonActiveMapPoolController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
) => {
  const seasonId = Number(req.params.season_id);
  const activeMapPool = await getActiveMapPoolMaps([seasonId]);
  res.json(activeMapPool);
};

export const getTeamsByLeagueController = async (
  req: RequestWithParams<{ season_id: string; league_id: string }>,
  res: Response
) => {
  const leagueIdNumber = Number(req.params.league_id);
  const seasonId = Number(req.params.season_id);
  const teams = await getTeamsByLeague(leagueIdNumber, seasonId);
  res.json(teams);
};

export const getTeamKeyPlayersController = async (
  req: RequestWithParams<{ team_id: string; season_id: string }>,
  res: Response
) => {
  const teamIdNumber = Number(req.params.team_id);
  const seasonId = Number(req.params.season_id);
  const keyPlayers = await getTeamKeyPlayers(teamIdNumber, seasonId);
  res.json(keyPlayers);
};

export const getTeamPlayersController = async (
  req: RequestWithParams<{ team_id: string; season_id: string }>,
  res: Response
) => {
  const teamIdNumber = Number(req.params.team_id);
  const seasonId = Number(req.params.season_id);
  const players = await getTeamPlayers(teamIdNumber, seasonId);
  res.json(players);
};

export const getFilteredPlayerCasterStatisticsController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
): Promise<void> => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const playerStats = await getPlayerStatsWithAllFilters(
    steam_id,
    parsedParams
  );

  res.status(200).json(playerStats);
};
