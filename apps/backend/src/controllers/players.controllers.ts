import { type Request, type Response, type NextFunction } from "express";
import {
  getPlayerDetailsBySteamId,
  getMultiplePlayerStatsByFilters,
  getPlayerStatsWithFilters,
  getPlayerBySteamId,
  getPlayerMatchHistoryByFilters,
  getPlayerGameDetailsWithFilters,
  getPlayerTeamDetailsWithFilters,
  getPlayerStatsForLatestSeason,
  getPlayerOldKanaElo,
  getPlayerMapStatsWithFilters,
  setPlayerKanaElo
} from "../models/player.models";

import {
  getPlayerHistoricalData,
  getPlayerHistoricalAverageByRank,
  getPlayerHistoricalAverageByLevel,
  getPlayerHistoricalAverage
} from "../models/player-historical.models";

import {
  getPlayerHoursForSteamAppId,
  getPlayerAppIdRank,
  getPlayerRankForPlatform,
  getPlayerKanaRank
} from "../services/player-ranks.services";
import {
  isSeasonPlatform,
  type RequestWithParams,
  type HistoricalDataParams
} from "@eggosystem/types";
import { isSteamProfilePublic } from "../services/steam.services";
import {
  getPlayerSkillDiagram,
  getMultiplePlayersSkillDiagrams
} from "../models/player-skills.models";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError
} from "../utils/errors";
import { logger } from "../utils/app-logger";

export const getPlayerBySteamIdController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const steam_id = req.params.steam_id;
  const [player] = await getPlayerBySteamId(steam_id);
  if (!player) return next(new NotFoundError("Not found"));
  res.json(player);
};

export const getPlayerDetailsBySteamIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const steam_id = req.params.steam_id;
  const player = await getPlayerDetailsBySteamId(steam_id);

  if (!player) return next(new NotFoundError("User not found"));

  res.status(200).json(player);
};

export const getIsPlayerProfilePublic = async (req: Request, res: Response) => {
  const steam_id = req.params.steam_id;
  const isPublic = await isSteamProfilePublic(steam_id);
  res.status(200).json({ public: isPublic });
};

/**
 * @param res Return hours = -1 if hours cannot be determined
 */
export const getPlayerSteamAppIdHours = async (req: Request, res: Response) => {
  const steam_id = req.params.steam_id;
  const app_id = Number(req.params.app_id);
  const season_id = req.query.season_id?.toString()
    ? parseInt(req.query.season_id.toString(), 10)
    : undefined;

  if (season_id && isNaN(season_id)) {
    throw new Error("Season id query param is not a number.");
  }

  const hours = await getPlayerHoursForSteamAppId(steam_id, app_id, season_id);
  res.status(200).json(hours);
};

/**
 * @param res Return cs2_rank = -1 if rank cannot be determined
 */
export const getPlayerSteamAppIdRank = async (req: Request, res: Response) => {
  const steam_id = req.params.steam_id;
  const app_id = Number(req.params.app_id);
  const season_id = req.query.season_id?.toString()
    ? parseInt(req.query.season_id.toString(), 10)
    : undefined;

  if (season_id && isNaN(season_id)) {
    throw new Error("Season id query param is not a number.");
  }
  const rank = await getPlayerAppIdRank(steam_id, app_id, season_id);
  res.status(200).json(rank);
};

export const getPlayerPlatformRank = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const steam_id = req.params.steam_id;
  const platform = req.params.platform;
  const season_id = req.query.season_id?.toString()
    ? parseInt(req.query.season_id.toString(), 10)
    : undefined;

  const isSeasonPlatformEnum = isSeasonPlatform(platform);
  if (isSeasonPlatformEnum) {
    const platform_rank = await getPlayerRankForPlatform(
      steam_id,
      platform,
      season_id
    );
    res.status(200).json(platform_rank);
    return;
  }
  return next(new BadRequestError("Unknown platform enum"));
};

export const getFilteredPlayersStatsController = async (
  req: Request,
  res: Response
) => {
  const { parsedParams } = req;

  const playerStats = await getMultiplePlayerStatsByFilters(parsedParams);

  res.status(200).json(playerStats);
};

export const getFilteredPlayerMatchHistoryController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const matchHistory = await getPlayerMatchHistoryByFilters(
    steam_id,
    parsedParams
  );

  if (!matchHistory)
    return next(new NotFoundError("Player match history not found."));

  res.status(200).json(matchHistory);
};

export const getFilteredPlayerTeamDetailsController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
) => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const playerTeamDetails = await getPlayerTeamDetailsWithFilters(
    steam_id,
    parsedParams
  );

  res.status(200).json(playerTeamDetails);
};

export const getFilteredPlayerGameDetailsController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
) => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const playerDetails = await getPlayerGameDetailsWithFilters(
    steam_id,
    parsedParams
  );

  // This should never happen...
  if (playerDetails.length > 1) {
    throw new Error("Player details length should only be one");
  }

  const [data] = playerDetails;
  res.status(200).json(data);
};

export const getFilteredPlayerStatisticsController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
): Promise<void> => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const playerStats = await getPlayerStatsWithFilters(steam_id, parsedParams);

  res.status(200).json(playerStats);
};

export const getPlayerKanaRankController = async (
  req: Request,
  res: Response
) => {
  const steam_id = req.params.steam_id;
  const kanaRank = await getPlayerKanaRank(steam_id);
  res.status(200).json(kanaRank);
};

export const getPlayerStatsForLatestSeasonController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const { steam_id } = req.params;

  const playerLatestSeasonStats = await getPlayerStatsForLatestSeason(steam_id);

  if (!playerLatestSeasonStats)
    return next(new NotFoundError("Player stats not found for latest season"));

  res.status(200).json(playerLatestSeasonStats);
};

export const getPlayerOldKanaEloController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const steam_id = req.params.steam_id;
  const oldKanaElo = await getPlayerOldKanaElo(steam_id);

  if (!oldKanaElo)
    return next(new NotFoundError("No previous season data found"));

  res.status(200).json(oldKanaElo);
};

/**
 * Get player skill diagram data with 5 core skill categories
 * Supports filtering by season, map, and stage
 * @param req Request with steam_id parameter and filter params
 * @param res Response with PlayerSkillDiagram object
 */
export const getPlayerSkillDiagramController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const skillDiagram = await getPlayerSkillDiagram(steam_id, parsedParams);

  if (!skillDiagram)
    return next(new NotFoundError("Player skill data not found"));

  res.status(200).json(skillDiagram);
};

/**
 * Get aggregated skill diagram for multiple players based on filter criteria
 * Returns a single diagram that represents the group average skill profile
 * @param req Request with filter parameters
 * @param res Response with a single aggregated PlayerSkillDiagram
 */
export const getMultiplePlayersSkillDiagramController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { parsedParams } = req;

  // Validate that only one filter type is selected
  const filterTypes = [
    parsedParams.team_ids !== null &&
      Array.isArray(parsedParams.team_ids) &&
      parsedParams.team_ids.length > 0,
    parsedParams.tier !== null && parsedParams.tier !== undefined,
    parsedParams.faceit_level !== null &&
      parsedParams.faceit_level !== undefined,
    parsedParams.cs2_rank_min !== null && parsedParams.cs2_rank_max !== null
  ];

  const activeFilters = filterTypes.filter(Boolean).length;

  // Multiple filter types selected - reject with error
  if (activeFilters > 1) {
    return next(
      new BadRequestError(
        "Only one filter type (team, tier, faceit_level, or cs2_rank range) can be selected at a time"
      )
    );
  }

  const aggregatedSkillDiagram =
    await getMultiplePlayersSkillDiagrams(parsedParams);

  if (!aggregatedSkillDiagram) {
    return next(
      new NotFoundError("No player data found matching the specified filters")
    );
  }

  res.status(200).json(aggregatedSkillDiagram);
};

export const getFilteredPlayerMapStatsController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
) => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const playerMapStats = await getPlayerMapStatsWithFilters(
    steam_id,
    parsedParams
  );

  res.status(200).json(playerMapStats);
};

export const setPlayerKanaEloController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { steam_id } = req.params;
  let { kana_elo, offered_elo } = req.body;
  const { calculus, season_id } = req.body;

  // Validate required fields
  if (kana_elo === undefined || kana_elo === null) {
    return next(new BadRequestError("kana_elo is required"));
  }

  if (!calculus) {
    return next(new BadRequestError("calculus is required"));
  }

  if (season_id === undefined || season_id === null) {
    return next(new BadRequestError("season_id is required"));
  }

  // Validate data types
  if (typeof kana_elo !== "number") {
    return next(new BadRequestError("kana_elo must be a number"));
  }

  if (typeof season_id !== "number") {
    return next(new BadRequestError("season_id must be a number"));
  }

  // If offered_elo is provided, validate it
  if (offered_elo !== undefined && offered_elo !== null) {
    if (typeof offered_elo !== "number") {
      return next(new BadRequestError("offered_elo must be a number"));
    }

    // Cap offered_elo at 400
    offered_elo = Math.min(400, offered_elo);
  }

  // Cap kana_elo at 400 to ensure it never exceeds the maximum
  kana_elo = Math.min(400, kana_elo);

  // Validate kana_elo range (only check lower bound now)
  if (kana_elo < 0) {
    return next(new BadRequestError("kana_elo must be between 0 and 400"));
  }

  try {
    // Update the kana_elo using the model function
    const success = await setPlayerKanaElo(
      steam_id,
      kana_elo,
      calculus,
      season_id,
      offered_elo,
      undefined // connection parameter (not using transaction)
    );

    if (!success) {
      return next(
        new NotFoundError("Player not found for the specified season")
      );
    }

    const response = {
      message: "Kana ELO updated successfully",
      steam_id,
      kana_elo,
      calculus,
      season_id
    };

    // Include offered_elo in the response if it was provided
    if (offered_elo !== undefined) {
      Object.assign(response, { offered_elo });
    }

    res.status(200).json(response);
  } catch (error) {
    logger.error("Update Kana ELO error", error);
    return next(new InternalServerError("Failed to update Kana ELO"));
  }
};

export const getPlayerHistoricalDataController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { steam_id } = req.params;
    const params = parseHistoricalParams(req.query); // No default games - returns all data
    const historicalData = await getPlayerHistoricalData(steam_id, params);
    res.json(historicalData);
  } catch (error) {
    next(error);
  }
};

const parseHistoricalParams = (
  query: { games?: string; period?: string },
  defaultGames?: number
): HistoricalDataParams => {
  const games = query.games ? parseInt(query.games) : defaultGames;
  const period = query.period;

  // Validate games parameter
  const validGames = [5, 10, 15, 20, 30, 40, 50];
  const finalGames = games && validGames.includes(games) ? games : defaultGames;

  // Validate period parameter
  const finalPeriod =
    period === "this_season" || period === "last_season" ? period : undefined;

  return {
    games: finalGames,
    period: finalPeriod
  };
};

export const getPlayerHistoricalAverageByRankController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rank = parseInt(req.params.rank);
    const params = parseHistoricalParams(req.query, 15); // Default to 15 games for backward compatibility with tests

    const averageData = await getPlayerHistoricalAverageByRank(rank, params);
    res.json(averageData);
  } catch (error) {
    next(error);
  }
};

export const getPlayerHistoricalAverageByLevelController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const level = parseInt(req.params.level);
    const params = parseHistoricalParams(req.query, 15); // Default to 15 games for backward compatibility with tests

    const averageData = await getPlayerHistoricalAverageByLevel(level, params);
    res.json(averageData);
  } catch (error) {
    next(error);
  }
};

export const getPlayerHistoricalAverageController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params = parseHistoricalParams(req.query, 15); // Default to 15 games for backward compatibility with tests

    const averageData = await getPlayerHistoricalAverage(params);
    res.json(averageData);
  } catch (error) {
    next(error);
  }
};
