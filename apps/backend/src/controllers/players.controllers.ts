import { type Request, type Response, type NextFunction } from "express";
import {
  getPlayerDetailsBySteamId,
  getMultiplePlayerStatsByFilters,
  getAllPlayerStatsWithPartialQueryFilters,
  getPlayerBySteamId,
  getPlayerMatchHistoryByFilters,
  getPlayerGameDetailsWithFilters,
  getPlayerTeamDetailsWithFilters,
  getPlayerStatsForLatestSeason,
  getPlayerOldKanaElo,
  getPlayerMapStatsWithFilters,
  setPlayerKanaElo,
  getAllPlayerStatsByFilters,
  getPlayerSteamIdByNickname
} from "../models/player.models";

import {
  getPlayerHistoricalData,
  getPlayerHistoricalAverageByRank,
  getPlayerHistoricalAverageByLevel,
  getPlayerHistoricalAverage,
  getPlayerSeasonsContext
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
import {
  isSteamProfilePublic,
  resolveSteamIdVanityURL
} from "../services/steam.services";
import { getPlayerFlashStatsCrossGame } from "../models/flash-events.models";
import { getPlayerUtilityStatsCrossGame } from "../models/round-utility-summary.models";
import { getPlayerRoundImpact } from "../models/match-game-analysis.models";
import {
  getPlayerSkillDiagram,
  getMultiplePlayersSkillDiagrams
} from "../models/player-skills.models";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError
} from "../utils/errors";
import { normalizeSteamId } from "../utils/steam-id-validator";
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
 * Resolves any Steam ID format (SteamID64, SteamID, SteamID3, custom URL, nickname, provider_username, or faceit_nickname) to SteamID64.
 * Resolution order:
 * 1. Local normalization (SteamID64, SteamID, SteamID3)
 * 2. Database search (nickname, provider_username, faceit_nickname) - checked before Steam API
 * 3. Steam API (custom vanity URLs)
 *
 * Supports:
 * - SteamID64: 76561198049745649
 * - SteamID: STEAM_0:1:44739960
 * - SteamID3: [U:1:89479921]
 * - Custom URL: sububobi
 * - Nickname: Player's Steam nickname
 * - Provider username: LinkedAccounts provider_username for steam provider
 * - FaceIT nickname: SteamPlayers.faceit_nickname
 *
 * @param req Request with steam_id parameter (can be any format)
 * @param res Response with resolved SteamID64
 * @param next Next function for error handling
 */
export const resolveSteamIdController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let input = req.params.steam_id;

  if (!input || typeof input !== "string") {
    return next(new BadRequestError("Steam ID is required"));
  }

  // Decode URL-encoded input (e.g., https%3A%2F%2Fsteamcommunity.com%2Fid%2Fsububobi)
  try {
    input = decodeURIComponent(input);
  } catch (error) {
    // If decoding fails, use original input
    logger.warn(`[Steam] Failed to decode Steam ID input: ${input}`, error);
  }

  try {
    // Try to normalize locally first (SteamID64, SteamID, SteamID3)
    let steamId64: string;
    let normalizeError: Error | undefined;
    try {
      steamId64 = normalizeSteamId(input);
      res.status(200).json({ steamId64 });
      return;
    } catch (err) {
      normalizeError = err instanceof Error ? err : new Error(String(err));
      // If normalization fails, it might be a custom URL, nickname, or other format
      // Continue to try resolving via other methods
    }

    // Try searching by nickname, provider_username, or faceit_nickname in our database first
    // This is faster than Steam API and uses our own data
    try {
      const foundSteamId = await getPlayerSteamIdByNickname(input.trim());
      if (foundSteamId) {
        res.status(200).json({ steamId64: foundSteamId });
        return;
      }
    } catch (_nicknameError) {
      logger.debug(
        `[Steam] Failed to search by nickname/provider_username/faceit_nickname: ${input}, trying Steam API`
      );
    }

    // Try resolving as custom URL (vanity URL) via Steam API as last resort
    try {
      steamId64 = await resolveSteamIdVanityURL(input);
      res.status(200).json({ steamId64 });
      return;
    } catch (_vanityError) {
      // If vanity URL resolution fails, we've exhausted all options
      logger.debug(`[Steam] Failed to resolve as vanity URL: ${input}`);
    }

    // If all methods failed, return error
    logger.warn(`[Steam] Failed to resolve Steam ID: ${input}`, normalizeError);
    return next(
      new BadRequestError(
        `Could not resolve Steam ID. Supported formats: SteamID64 (17 digits), SteamID (STEAM_X:Y:Z), SteamID3 ([U:1:AccountID]), custom URL, nickname, provider username, or FaceIT nickname.`
      )
    );
  } catch (error) {
    logger.error(
      `[Steam] Unexpected error resolving Steam ID: ${input}`,
      error
    );
    return next(
      new InternalServerError(
        `Failed to resolve Steam ID: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    );
  }
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
 * @param query skipExternalCheck to use only Redis + DB (no Leetify)
 */
export const getPlayerSteamAppIdRank = async (req: Request, res: Response) => {
  const steam_id = req.params.steam_id;
  const app_id = Number(req.params.app_id);
  const season_id = req.query.season_id?.toString()
    ? parseInt(req.query.season_id.toString(), 10)
    : undefined;
  const skipExternalCheck = req.query.skipExternalCheck !== undefined;

  if (season_id && isNaN(season_id)) {
    throw new Error("Season id query param is not a number.");
  }
  const rank = await getPlayerAppIdRank(steam_id, app_id, season_id, {
    skipExternalCheck
  });
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
  const skipExternalCheck = req.query.skipExternalCheck !== undefined;

  const isSeasonPlatformEnum = isSeasonPlatform(platform);
  if (isSeasonPlatformEnum) {
    const platform_rank = await getPlayerRankForPlatform(
      steam_id,
      platform,
      season_id,
      { skipExternalCheck }
    );
    res.status(200).json(platform_rank);
    return;
  }
  return next(new BadRequestError("Unknown platform enum"));
};

export const getFilteredAllPlayersStatsController = async (
  req: Request,
  res: Response
) => {
  const { parsedParams } = req;
  const playerStats = await getAllPlayerStatsByFilters(parsedParams);
  res.status(200).json(playerStats);
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

export const getAllFilteredPlayerStatisticsController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
): Promise<void> => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const playerStats = await getAllPlayerStatsWithPartialQueryFilters(
    steam_id,
    parsedParams
  );

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

function parsePlayerSeasonContextQuery(
  query: Request["query"]
):
  | { organizer_id: number; app_id: number; gametype: string }
  | BadRequestError {
  const organizerRaw = query.organizer_id;
  const appRaw = query.app_id;
  const gametypeRaw = query.gametype;

  if (
    organizerRaw === undefined ||
    appRaw === undefined ||
    gametypeRaw === undefined
  ) {
    return new BadRequestError(
      "organizer_id, app_id, and gametype query parameters are required"
    );
  }

  const organizer_id = parseInt(String(organizerRaw), 10);
  const app_id = parseInt(String(appRaw), 10);
  const gametype = String(gametypeRaw).trim();

  if (
    !Number.isInteger(organizer_id) ||
    organizer_id <= 0 ||
    !Number.isInteger(app_id) ||
    app_id <= 0 ||
    gametype.length === 0
  ) {
    return new BadRequestError(
      "organizer_id and app_id must be positive integers; gametype must be non-empty"
    );
  }

  return { organizer_id, app_id, gametype };
}

export const getPlayerSeasonsContextController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { steam_id } = req.params;
    if (!steam_id) return next(new BadRequestError("Steam ID is required"));

    const context = parsePlayerSeasonContextQuery(req.query);
    if (context instanceof BadRequestError) {
      return next(context);
    }

    const seasons = await getPlayerSeasonsContext(steam_id, context);
    res.json(seasons);
  } catch (error) {
    next(error);
  }
};

export const getPlayerHistoricalDataController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { steam_id } = req.params;
    const params = parseHistoricalParams(req.query);
    const historicalData = await getPlayerHistoricalData(steam_id, params);
    res.json(historicalData);
  } catch (error) {
    next(error);
  }
};

const parseHistoricalParams = (
  query: { games?: string; season_id?: string },
  defaultGames?: number
): HistoricalDataParams => {
  const games = query.games ? parseInt(query.games) : defaultGames;
  const validGames = [5, 10, 15, 20, 30, 40, 50];
  const finalGames = games && validGames.includes(games) ? games : defaultGames;

  const parsedSeasonId = query.season_id
    ? parseInt(query.season_id, 10)
    : undefined;
  const season_id =
    parsedSeasonId !== undefined &&
    Number.isInteger(parsedSeasonId) &&
    parsedSeasonId > 0
      ? parsedSeasonId
      : undefined;

  return { games: finalGames, season_id };
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

export const getPlayerFlashStatsCrossGameController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
) => {
  const { steam_id } = req.params;
  const seasonId = req.query.tournamentId
    ? parseInt(req.query.tournamentId as string, 10)
    : undefined;
  const data = await getPlayerFlashStatsCrossGame(steam_id, { seasonId });
  res.json(data);
};

export const getPlayerUtilityStatsCrossGameController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
) => {
  const { steam_id } = req.params;
  const seasonId = req.query.tournamentId
    ? parseInt(req.query.tournamentId as string, 10)
    : undefined;
  const data = await getPlayerUtilityStatsCrossGame(steam_id, { seasonId });
  res.json(data);
};

export const getPlayerRoundImpactController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
) => {
  const { steam_id } = req.params;
  const seasonId = req.query.tournamentId
    ? parseInt(req.query.tournamentId as string, 10)
    : undefined;
  const data = await getPlayerRoundImpact(steam_id, { seasonId });
  res.json(data);
};
