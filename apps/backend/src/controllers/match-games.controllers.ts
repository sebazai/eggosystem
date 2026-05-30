import { type Response, type NextFunction } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import {
  getGameRoundInfo,
  getGamePlayerStats,
  getGameTeamRoundBreakdown,
  getGameTopPlayers,
  getGameClip
} from "../models/match-game.models";
import {
  getMatchGameAfterplantAnalysis,
  getMatchGameOpeningDuels,
  getMatchGameKillMatrix,
  getMatchGameTradeStats,
  getMatchGameInsights,
  getRoundSwingEvents,
  getEntryKills,
  type KillMatrixFilters
} from "../models/match-game-analysis.models";
import {
  getFlashMatrix,
  getPlayerFlashStats
} from "../models/flash-events.models";
import { getSetupPairs } from "../models/setup-events.models";
import { getWastedUtilityByPlayer } from "../models/wasted-utility-events.models";
import { getRoundUtilitySummary } from "../models/round-utility-summary.models";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { getTeamStats } from "../models/match.models";

export const getGameTeamRoundBreakdownController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const teamBreakdown = await getGameTeamRoundBreakdown(match_game_id);
  if (teamBreakdown.length !== 2) {
    throw new Error(
      `Did not find exactly two teams for game round breakdown: ${match_game_id}`
    );
  }
  res.json(teamBreakdown);
};

export const getGameRoundInfoController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const roundInfo = await getGameRoundInfo(match_game_id);
  res.json(roundInfo);
};

export const getGameTeamStatsController = async (
  req: RequestWithParams<{ match_id: string; match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  if (isNaN(match_game_id)) {
    throw new BadRequestError("Invalid match game ID");
  }
  const teamstats = await getTeamStats({ match_game_id });
  res.json(teamstats);
};

export const getGamePlayerStatsController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const stat = req.query.stat as "CT" | "T" | undefined;

  const playerstats = await getGamePlayerStats(match_game_id, stat);

  res.json(playerstats);
};

export const getGameTopPlayersController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const topplayers = await getGameTopPlayers(match_game_id);
  if (!topplayers) {
    return next(
      new NotFoundError("Could not find top players for match game id")
    );
  }
  res.json(topplayers);
};

export const getMatchGameAfterplantAnalysisController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const data = await getMatchGameAfterplantAnalysis(match_game_id);
  res.json(data);
};

export const getMatchGameKillMatrixController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const filters: KillMatrixFilters = {
    excludeExitKills: req.query.excludeExitKills === "true",
    postPlantOnly: req.query.postPlantOnly === "true",
    excludeEcoKills: req.query.excludeEcoKills === "true"
  };
  const data = await getMatchGameKillMatrix(match_game_id, filters);
  res.json(data);
};

export const getMatchGameOpeningDuelsController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const data = await getMatchGameOpeningDuels(match_game_id);
  res.json(data);
};

export const getMatchGameTradeStatsController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const data = await getMatchGameTradeStats(match_game_id);
  res.json(data);
};

export const getMatchGameInsightsController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const data = await getMatchGameInsights(match_game_id);
  res.json(data);
};

export const getRoundSwingsController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const roundNumber = req.query.roundNumber
    ? parseInt(req.query.roundNumber as string, 10)
    : undefined;
  const limit = req.query.limit
    ? parseInt(req.query.limit as string, 10)
    : undefined;

  const data = await getRoundSwingEvents(match_game_id, { roundNumber, limit });
  res.json({ round_swings: data });
};

export const getFlashMatrixController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const [matrix, playerStats] = await Promise.all([
    getFlashMatrix(match_game_id, { enemyOnly: false }),
    getPlayerFlashStats(match_game_id)
  ]);
  res.json({ flash_matrix: matrix, player_stats: playerStats });
};

export const getEntryKillsController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const data = await getEntryKills(match_game_id);
  res.json({ entry_kills: data });
};

export const getSetupPairsController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const data = await getSetupPairs(match_game_id);
  res.json({ setup_pairs: data });
};

export const getWastedUtilityController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const data = await getWastedUtilityByPlayer(match_game_id);
  res.json({ wasted_utility: data });
};

export const getRoundUtilitySummaryController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const data = await getRoundUtilitySummary(match_game_id);
  res.json({ round_utility_summary: data });
};

export const getGameClipController = async (
  req: RequestWithParams<{ match_game_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const match_game_id = parseInt(req.params.match_game_id, 10);
  const clip = await getGameClip(match_game_id);
  if (clip.length === 0) {
    return next(new NotFoundError("Clip not found"));
  } else {
    res.json(clip[0]);
  }
};
