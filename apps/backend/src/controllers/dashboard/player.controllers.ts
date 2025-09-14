import { type NextFunction, type Response } from "express";

import { checkPlayerAdditionEligibility } from "../../models/dashboard/season.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { BadRequestError } from "../../utils/errors";
import { getConnection } from "../../db/mysqlConnection";
import {
  getCSRank,
  getPlayerHoursForSteamAppId
} from "../../services/player-ranks.services";
import { insertFaceITPlayerRankForSeason } from "../../models/season-player-ranks.models";
import { getFaceITCS2Rank } from "../../services/faceit.services";
import { setPlayerKanaElo } from "../../models/player.models";
import { insertSeasonTeamPlayer } from "../../models/season-team-players.models";
import { type RequestWithParams } from "@eggosystem/types";
import { resolveMatchId } from "../../utils/matchUtils";
import { getPlayerRankForPlatform } from "../../services/player-ranks.services";
import { SeasonPlatform, type PlayerValidationResult } from "@eggosystem/types";
import { getPlayerDetailsForDashboardBySteamId } from "../../models/dashboard/player.models";
/**
 * Controller to add a player to a team
 * This will:
 * 1. Set the player's kana_elo value
 * 2. Add the player to the SeasonTeamPlayers table as 'primary'
 */
export const addPlayerToTeamController = async (
  req: RequestWithParams<{
    season_id: string;
    team_id: string;
    steam_id: string;
  }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);
  const steamId = req.params.steam_id;
  const { kana_elo, calculus } = req.body;

  // Validate required fields
  if (kana_elo === undefined || kana_elo === null) {
    return next(new BadRequestError("kana_elo is required"));
  }

  // Don't require calculus anymore - it's optional
  const calculusData = calculus || {};

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    // 1. First, check if player has all required data in SeasonPlayerRanks
    const checkPlayerQuery = `
        SELECT 
          id, 
          cs2_rank, 
          faceit_level, 
          faceit_elo, 
          cs_hours, 
          kana_elo 
        FROM SeasonPlayerRanks 
        WHERE season_id = ? AND steam_id = ?
      `;
    const existingPlayerResult = await runQuery<
      Array<{
        id: number;
        cs2_rank: number | null;
        faceit_level: number | null;
        faceit_elo: number | null;
        cs_hours: number | null;
        kana_elo: number | null;
      }>
    >(checkPlayerQuery, [seasonId, steamId], connection);

    const existingPlayer =
      existingPlayerResult && existingPlayerResult.length > 0
        ? existingPlayerResult[0]
        : null;

    // 2. If player data is incomplete, fetch it from external services
    if (
      !existingPlayer ||
      existingPlayer.cs2_rank === null ||
      existingPlayer.faceit_level === null ||
      existingPlayer.cs_hours === null
    ) {
      // Fetch real CS2 rank data from Leetify (range 1000-30000)
      const rankData = await getCSRank(steamId);
      const playerCS2Rank =
        rankData.average_rank !== -1 ? rankData.average_rank : null;

      // Fetch real hours played from Steam API
      const hoursData = await getPlayerHoursForSteamAppId(steamId, 730);
      const playerCSHours = hoursData.hours !== -1 ? hoursData.hours : null;

      // Fetch real FACEIT data (levels 1-10, ELO values)
      const faceitData = await getFaceITCS2Rank(steamId);

      if (faceitData.faceit_elo < 0) {
        return next(new BadRequestError("FaceIT data not found"));
      }

      if (rankData.average_rank < 0) {
        return next(new BadRequestError("CS2 rank not found"));
      }

      if (hoursData.hours < 0) {
        return next(new BadRequestError("Hours not found"));
      }

      // Create or update player in SeasonPlayerRanks with real data
      await insertFaceITPlayerRankForSeason(
        steamId,
        seasonId,
        playerCS2Rank, // Real CS2 rank (1000-30000 range)
        playerCSHours, // Real hours played from Steam
        {
          faceit_level: faceitData.faceit_level,
          faceit_elo: faceitData.faceit_elo,
          faceit_kd: faceitData.faceit_kd,
          faceit_date: faceitData.faceit_date
        },
        { connection }
      );
    }

    // 3. Now that we have player data, check eligibility
    const eligibility = await checkPlayerAdditionEligibility(
      seasonId,
      teamId,
      steamId,
      { connection }
    );

    // 4. Verify player is eligible
    if (!eligibility.canAddPlayer) {
      return next(
        new BadRequestError("Player is not eligible to be added to this team")
      );
    }

    // 5. Set the player's kana_elo from the eligibility check
    const calculusString =
      typeof calculusData === "object"
        ? JSON.stringify(calculusData)
        : String(calculusData || "{}");

    await setPlayerKanaElo(
      steamId,
      eligibility.selectedTeam.new_player_kana_elo,
      calculusString,
      seasonId,
      undefined, // offered_elo (not needed here)
      connection
    );

    // 6. Finally add the player to the team in SeasonTeamPlayers
    await insertSeasonTeamPlayer(
      seasonId,
      teamId,
      { steam_id: steamId },
      connection
    );

    await connection.commit();

    res.status(200).json({
      message: "Player successfully added to the team",
      steam_id: steamId,
      team_id: teamId,
      season_id: seasonId,
      kana_elo
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
};

/**
 * Controller to validate player data before adding to team
 * This checks:
 * 1. Player hours from Steam API
 * 2. CS2 rank from Leetify
 * 3. Platform rank (FACEIT, etc.)
 * 4. Kanahub profile validation
 */
export const validatePlayerController = async (
  req: RequestWithParams<{
    steam_id: string;
  }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const steamId = req.params.steam_id;
  const seasonId = req.query.season_id
    ? Number(req.query.season_id)
    : undefined;

  if (!seasonId) {
    return next(new BadRequestError("season_id is a required query parameter"));
  }

  try {
    // First, get the season details to get platform and app_id
    const seasonQuery = `
        SELECT s.platform, g.app_id 
        FROM Seasons s 
        JOIN Games g ON s.game_id = g.id 
        WHERE s.id = ?
      `;
    const seasonResult = await runQuery<
      Array<{ platform: SeasonPlatform; app_id: number }>
    >(seasonQuery, [seasonId]);

    if (!seasonResult || seasonResult.length === 0) {
      return next(new BadRequestError(`Season with ID ${seasonId} not found`));
    }

    const season = seasonResult[0];
    const { platform, app_id: appId } = season;

    // Run all validation checks in parallel
    const [hoursData, rankData, platformRankData, playerData] =
      await Promise.allSettled([
        getPlayerHoursForSteamAppId(steamId, appId, seasonId),
        getCSRank(steamId, seasonId),
        getPlayerRankForPlatform(steamId, platform, seasonId),
        getPlayerDetailsForDashboardBySteamId(steamId)
      ]);

    let externalRankData: number = -1;
    if (platformRankData.status === "fulfilled" && platformRankData.value) {
      const propertyName =
        platform === SeasonPlatform.Kanaliiga ? "kana_elo" : "faceit_level";
      externalRankData =
        propertyName in platformRankData.value
          ? platformRankData.value[
              propertyName as keyof typeof platformRankData.value
            ]
          : -1;
    }

    // Process results
    const validationResult: PlayerValidationResult = {
      steam_id: steamId,
      season_id: seasonId,
      app_id: appId,
      platform,
      hours: {
        value: hoursData.status === "fulfilled" ? hoursData.value.hours : -1,
        success: hoursData.status === "fulfilled" && hoursData.value.hours > 0,
        error:
          hoursData.status === "rejected"
            ? hoursData.reason?.message || "Unknown error"
            : null
      },
      rank: {
        value:
          rankData.status === "fulfilled" ? rankData.value.average_rank : -1,
        success:
          rankData.status === "fulfilled" && rankData.value.average_rank > 0,
        error:
          hoursData.status === "rejected"
            ? hoursData.reason?.message || "Unknown error"
            : null
      },
      platform_rank: {
        value: externalRankData,
        success:
          platformRankData.status === "fulfilled" &&
          !!externalRankData &&
          externalRankData > 0,
        error:
          platformRankData.status === "rejected"
            ? platformRankData.reason?.message || "Unknown error"
            : null
      },
      profile: {
        success:
          playerData.status === "fulfilled" &&
          !!playerData.value &&
          !!playerData.value.account_id &&
          !!playerData.value.nickname &&
          Boolean(playerData.value.work_email_verified) &&
          Boolean(playerData.value.is_valid_full_name) &&
          Boolean(playerData.value.is_valid_work_email),
        data:
          playerData.status === "fulfilled" && playerData.value
            ? {
                account_id: playerData.value.account_id,
                nickname: playerData.value.nickname,
                steam_id: playerData.value.steam_id,
                discord: playerData.value.discord || null,
                work_email: playerData.value.work_email || null,
                work_email_verified: Boolean(
                  playerData.value.work_email_verified
                ),
                is_work_email_personal_email: Boolean(
                  playerData.value.is_work_email_personal_email
                ),
                is_valid_full_name: Boolean(
                  playerData.value.is_valid_full_name
                ),
                is_valid_work_email: Boolean(
                  playerData.value.is_valid_work_email
                )
              }
            : null,
        error:
          playerData.status === "rejected"
            ? playerData.reason?.status === 404
              ? "Player not found in Kanahub"
              : null
            : null
      },
      overall_success: false // Will be calculated below
    };

    // Calculate overall validation status
    validationResult.overall_success =
      validationResult.hours.success &&
      validationResult.rank.success &&
      validationResult.platform_rank.success &&
      validationResult.profile.success;

    res.status(200).json(validationResult);
  } catch (error) {
    return next(error);
  }
};

/**
 * Controller to add a substitute player to a team
 * This will:
 * 1. Add the player to the SeasonTeamPlayers table as 'substitute'
 * 2. Optionally set match_id if provided for single-match substitution
 * Note: No eligibility check needed for substitutes, only validation should be done on frontend
 */
export const addSubstitutePlayerController = async (
  req: RequestWithParams<{
    season_id: string;
    team_id: string;
    steam_id: string;
  }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);
  const steamId = req.params.steam_id;
  const { match_id } = req.body;

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    // Resolve match_id if provided (can be numeric ID, Faceit room ID, or Faceit URL)
    let resolvedMatchId: number[] | undefined;
    if (match_id !== undefined && match_id !== null) {
      try {
        resolvedMatchId = await resolveMatchId(
          match_id.toString(),
          seasonId,
          connection
        );
      } catch (error) {
        await connection.rollback();
        return next(error);
      }
    }

    if (resolvedMatchId !== undefined) {
      resolvedMatchId.forEach(async (matchId) => {
        // Add the player to the team as substitute in SeasonTeamPlayers
        const insertData: {
          steam_id: string;
          role: "substitute";
          match_id?: number;
        } = {
          steam_id: steamId,
          role: "substitute"
        };
        insertData.match_id = matchId;
        await insertSeasonTeamPlayer(seasonId, teamId, insertData, connection);
      });
    }

    await connection.commit();

    res.status(200).json({
      message: "Substitute player successfully added to the team",
      steam_id: steamId,
      team_id: teamId,
      season_id: seasonId,
      role: "substitute",
      match_id: resolvedMatchId || null
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
};
