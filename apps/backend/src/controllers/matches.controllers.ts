import { type Request, type Response, type NextFunction } from "express";
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
  getMatchWithBreadcrumbInfo,
  getMatchesWithTeamDataBySeasonId,
  getMatchIs2xBO1,
  getMatchTeamLineups
} from "../models/match.models";
import type {
  MatchGame,
  MatchInfo,
  MatchTeamInfo,
  MatchesWithTeamData,
  RequestWithParams,
  RequestWithParamsAndQuery
} from "@eggosystem/types";
import { NotFoundError } from "../utils/errors";
import { getActiveOrPassedSeasonId } from "../services/season.services";

export const getMatchesController = async (req: Request, res: Response) => {
  const matches = await getMatches(); // Wait for the promise to resolve
  res.status(200).json({ matches });
};

export const getMatchIs2xBO1Controller = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response
) => {
  const matchId = parseInt(req.params.match_id, 10);
  const is2xBO1 = await getMatchIs2xBO1(matchId);
  res.status(200).json({ is2xBO1 });
};

// Used externally by grmrpr
export const getMatchesBySeasonIdController = async (
  req: RequestWithParamsAndQuery<{ season_id: string }, { league_id?: string }>,
  res: Response,
  _next: NextFunction
) => {
  const seasonId = await getActiveOrPassedSeasonId(req.params.season_id);

  const leagueId = req.query.league_id
    ? isNaN(Number(req.query.league_id))
      ? null
      : Number(req.query.league_id)
    : null;

  const matches = await getMatchesWithTeamDataBySeasonId(seasonId, leagueId);
  res.status(200).json({
    matches: matches.map(
      (match) =>
        ({
          ...match,
          teams: JSON.parse(match.teams) as Record<string, MatchTeamInfo>
        }) satisfies MatchesWithTeamData
    )
  });
};

export const getMatchController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const matchId = parseInt(req.params.match_id, 10);
  const [match] = await getMatch(matchId);

  if (!match) {
    return next(new NotFoundError("Match not found"));
  }

  res.json(match);
};

export const getMatchBreadcrumbController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const matchId = parseInt(req.params.match_id, 10);
  const [match] = await getMatchWithBreadcrumbInfo(matchId);
  if (!match) {
    return next(new NotFoundError("Match data not found"));
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

  const topplayers = await getMatchTopPlayers(match_id);

  if (!topplayers) {
    res
      .status(404)
      .json({ error: { message: "Could not find top players for match" } });
    return;
  }

  res.json(topplayers);
};

export const getMatchPlayerStatsController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response,
  _next: NextFunction
) => {
  const match_id = parseInt(req.params.match_id, 10);
  const stat = req.query.stat as "CT" | "T" | undefined;

  const playerstats = await getMatchPlayerStats(match_id, stat);

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
  res: Response,
  next: NextFunction
) => {
  const match_id = parseInt(req.params.match_id, 10);
  const mapsPlayed = await getMatchGames(match_id);

  if (mapsPlayed.length === 0) {
    return next(new NotFoundError("Could not find maps played for match"));
  }

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

export const getMatchTeamLineupsController = async (
  req: RequestWithParams<{ match_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const matchId = parseInt(req.params.match_id, 10);

  const lineups = await getMatchTeamLineups(matchId);

  if (!lineups) {
    return next(new NotFoundError("Match lineups not found"));
  }

  res.json(lineups);
};
