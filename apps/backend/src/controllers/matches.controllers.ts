import { type Request, type Response } from "express";
import {
  getMatches,
  getMatchPlayerStats,
  getMatchTeamStats,
  getMatchTopPlayers,
  getMatchesByFilters,
  getMatchGames,
  getMatchInfo,
  getMatch,
  getMatchGame,
  getMatchMapVetoes,
  getMatchWithBreadcrumbInfo
} from "../models/match.models";
import type {
  MatchGame,
  MatchInfo,
  MatchTeamInfo,
  RequestWithParams
} from "@eggosystem/types";
import { NotFoundError } from "../utils/errors";

export const getMatchesController = async (req: Request, res: Response) => {
  const matches = await getMatches(); // Wait for the promise to resolve
  res.status(200).json({ matches });
};

export const getMatchController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const matchId = parseInt(req.params.match_id, 10);
  const [match] = await getMatch(matchId);

  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  res.json(match);
};

export const getMatchBreadcrumbController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const matchId = parseInt(req.params.match_id, 10);
  const [match] = await getMatchWithBreadcrumbInfo(matchId);
  if (!match) {
    res.status(404).json({ error: "Match data not found" });
    return;
  }
  res.json(match);
};

export const getMatchGameController = async (
  req: RequestWithParams<{ match_id: string; game_id: string }>,
  res: Response
) => {
  const matchId = parseInt(req.params.match_id, 10);
  const gameId = parseInt(req.params.game_id, 10);
  const [matchGame] = await getMatchGame(matchId, gameId);

  if (!matchGame) {
    throw new NotFoundError("Match game not found");
  }

  res.json(matchGame);
};

export const getMatchInfoController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const matchId = parseInt(req.params.match_id, 10);
  const match = await getMatchInfo(matchId);

  if (!match) {
    throw new NotFoundError("Match not found");
  }

  const matchInfo = {
    ...match,
    game_ids: JSON.parse(match.game_ids) as MatchGame["id"] | MatchGame["id"][],
    teams: JSON.parse(match.teams) as Record<string, MatchTeamInfo>
  } satisfies MatchInfo;

  res.json(matchInfo);
};

export const getFilteredMatchesController = async (
  req: Request,
  res: Response
) => {
  // Call the model function with the parameters in the correct order
  const matches = await getMatchesByFilters(req.parsedParams);

  res.json(matches);
};

export const getMatchTopPlayersController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);

  // First check if the match exists
  const [match] = await getMatch(match_id);
  if (!match) {
    res.status(404).json({ message: "Could not find season for match id" });
    return;
  }

  const topplayers = await getMatchTopPlayers(match_id);

  // Check if any top player data was found
  const hasData = Object.values(topplayers).some(
    (value) => value !== null && value !== undefined
  );
  if (!hasData) {
    res.status(404).json({ message: "Could not find season for match id" });
    return;
  }

  res.json(topplayers);
};

export const getMatchPlayerStatsController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);

  const playerstats = await getMatchPlayerStats(match_id);

  res.json(playerstats);
};

export const getMatchTeamStatsController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);
  const teamstats = await getMatchTeamStats(match_id);
  res.json(teamstats);
};

export const getMatchGamesController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const match_id = parseInt(req.params.match_id, 10);
  const mapsPlayed = await getMatchGames(match_id);

  res.json(mapsPlayed);
};

export const getMatchMapVetoesController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const matchId = parseInt(req.params.match_id, 10);
  const vetoes = await getMatchMapVetoes(matchId);
  res.json(vetoes || []);
};
