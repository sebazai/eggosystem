import { type Request, type Response } from "express";
import {
  getPlayerDetailsBySteamId,
  getMultiplePlayerStatsByFilters,
  getPlayerStatsWithFilters,
  getPlayerBySteamId,
  getPlayerMatchHistoryByFilters,
  getPlayerGameDetailsWithFilters,
  getPlayerTeamDetailsWithFilters,
  getPlayerStatsForLatestSeason,
  getPlayerOldKanaElo
} from "../models/player.models";

import {
  getPlayerHoursForSteamAppId,
  getPlayerAppIdRank,
  getPlayerRankForPlatform,
  getPlayerKanaRank
} from "../services/player-ranks.services";
import { isSeasonPlatform, type RequestWithParams } from "@eggosystem/types";
import { isSteamProfilePublic } from "../services/steam.services";
import {
  getPlayerSkillDiagram,
  getMultiplePlayersSkillDiagrams
} from "../models/player-skills.models";

export const getPlayerBySteamIdController = async (
  req: RequestWithParams<{ steam_id: string }>,
  res: Response
) => {
  const steam_id = req.params.steam_id;
  const [player] = await getPlayerBySteamId(steam_id);
  if (!player) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json(player);
};

export const getPlayerDetailsBySteamIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const steam_id = req.params.steam_id;
  const player = await getPlayerDetailsBySteamId(steam_id);

  if (!player) {
    res.status(404).json({ message: "User not found" });
    return;
  }

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

export const getPlayerPlatformRank = async (req: Request, res: Response) => {
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
  res.status(400).json({ message: "Unknown platform enum" });
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
  res: Response
) => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const matchHistory = await getPlayerMatchHistoryByFilters(
    steam_id,
    parsedParams
  );

  if (!matchHistory) {
    res.status(404).json({
      error: "Player match history not found."
    });
    return;
  }

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
  res: Response
) => {
  const { steam_id } = req.params;

  const playerLatestSeasonStats = await getPlayerStatsForLatestSeason(steam_id);

  if (!playerLatestSeasonStats) {
    res
      .status(404)
      .json({ message: "Player stats not found for latest season" });
    return;
  }

  res.status(200).json(playerLatestSeasonStats);
};

export const getPlayerOldKanaEloController = async (
  req: Request,
  res: Response
) => {
  const steam_id = req.params.steam_id;
  const oldKanaElo = await getPlayerOldKanaElo(steam_id);

  if (!oldKanaElo) {
    res.status(404).json({ message: "No previous season data found" });
    return;
  }

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
  res: Response
) => {
  const { steam_id } = req.params;
  const { parsedParams } = req;

  const skillDiagram = await getPlayerSkillDiagram(steam_id, parsedParams);

  if (!skillDiagram) {
    res.status(404).json({ message: "Player skill data not found" });
    return;
  }

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
  res: Response
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
    res.status(400).json({
      message:
        "Only one filter type (team, tier, faceit_level, or cs2_rank range) can be selected at a time"
    });
    return;
  }

  const aggregatedSkillDiagram =
    await getMultiplePlayersSkillDiagrams(parsedParams);

  if (!aggregatedSkillDiagram) {
    res.status(404).json({
      message: "No player data found matching the specified filters"
    });
    return;
  }

  res.status(200).json(aggregatedSkillDiagram);
};
