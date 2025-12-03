import { type NextFunction, type Response } from "express";

import { checkPlayerAdditionEligibility } from "../../models/dashboard/season.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { BadRequestError } from "../../utils/errors";
import { getConnection } from "../../db/mysqlConnection";
import {
  getCSRank,
  getPlayerHoursForSteamAppId
} from "../../services/player-ranks.services";
import { insertPlayerRankForSeason } from "../../models/season-player-ranks.models";
import { getFaceITCS2Rank } from "../../services/faceit.services";
import { setPlayerKanaElo } from "../../models/player.models";
import { insertSeasonTeamPlayer } from "../../models/season-team-players.models";
import { insertSeasonTeamRegistrationPlayer } from "../../models/season-team-registration-player.models";
import {
  type RequestWithParamsAndBody,
  type RequestWithParams,
  type InsertSeasonTeamPlayer
} from "@eggosystem/types";
import { resolveMatchId } from "../../utils/matchUtils";
import { getPlayerRankForPlatform } from "../../services/player-ranks.services";
import { SeasonPlatform, type PlayerValidationResult } from "@eggosystem/types";
import { getPlayerDetailsForDashboardBySteamId } from "../../models/dashboard/player.models";
import { preparePlayerForSignup } from "../../models/player.models";
import { normalizeSteamId } from "../../utils/steam-id-validator";
import { ensureMatchIdAndTeamIdMatches } from "../../models/match.models";
import { ensureSeasonMaxPlayersForTeam } from "../../services/season.services";
/**
 * Controller to add a player to a team
 * This will:
 * 1. Set the player's kana_elo value (for finalized seasons)
 * 2. Add the player to SeasonTeamPlayers (finalized) or SeasonTeamRegistrationPlayers (registration)
 * Supports query parameter ?context=registration to add to active registrations
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
  const context =
    (req.query.context as string) === "registration"
      ? "registration"
      : "finalized";

  // Validate required fields
  if (kana_elo === undefined || kana_elo === null) {
    return next(new BadRequestError("kana_elo is required"));
  }

  // Skip max players check for registration context
  if (context === "finalized") {
    await ensureSeasonMaxPlayersForTeam(seasonId, teamId);
  }

  // Don't require calculus anymore - it's optional
  const calculusData = calculus || {};

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    // For registration context, simplified flow
    if (context === "registration") {
      // 1. Verify player has valid profile
      const playerProfile =
        await getPlayerDetailsForDashboardBySteamId(steamId);
      if (
        !playerProfile ||
        !playerProfile.account_id ||
        !playerProfile.nickname ||
        !playerProfile.work_email_verified ||
        !playerProfile.is_valid_full_name ||
        !playerProfile.is_valid_work_email
      ) {
        return next(
          new BadRequestError(
            "Cannot add player: Profile validation is required. The player must have a verified Kanahub profile with valid email and full name before being added to a team."
          )
        );
      }

      // 2. Check eligibility (mainly for kana_elo calculation)
      const eligibility = await checkPlayerAdditionEligibility(
        seasonId,
        teamId,
        steamId,
        { connection, context: "registration" }
      );

      // 3. Set the player's kana_elo from the eligibility check
      const calculusString =
        typeof eligibility.selectedTeam.csrankker_components === "object"
          ? JSON.stringify(eligibility.selectedTeam.csrankker_components)
          : String(eligibility.selectedTeam.csrankker_components || "{}");

      await setPlayerKanaElo(
        steamId,
        eligibility.selectedTeam.new_player_kana_elo,
        calculusString,
        seasonId,
        undefined, // offered_elo (not needed here)
        connection
      );

      // 5. Add player to SeasonTeamRegistrationPlayers (not captain, not co-captain)
      await insertSeasonTeamRegistrationPlayer(
        seasonId,
        teamId,
        {
          steam_id: steamId,
          is_captain: false,
          is_co_captain: false
        },
        connection
      );

      await connection.commit();

      res.status(200).json({
        message: "Player successfully added to the registration",
        steam_id: steamId,
        team_id: teamId,
        season_id: seasonId,
        context: "registration"
      });
      return;
    }

    // Finalized season context - original logic
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
      await insertPlayerRankForSeason(
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

    // 3. Check if team is in tier 1 league
    const tierQuery = `
      SELECT sl.tier
      FROM SeasonLeagueTeams slt
      JOIN SeasonLeagues sl ON sl.season_id = slt.season_id AND sl.league_id = slt.league_id
      WHERE slt.team_id = ? AND slt.season_id = ?
      LIMIT 1
    `;
    const tierResults = await runQuery<Array<{ tier: number }>>(
      tierQuery,
      [teamId, seasonId],
      connection
    );
    const isTier1 = tierResults.length > 0 && tierResults[0].tier === 1;

    // 4. Now that we have player data, check eligibility
    const eligibility = await checkPlayerAdditionEligibility(
      seasonId,
      teamId,
      steamId,
      { connection, context: "finalized" }
    );

    // 5. Verify player is eligible (skip check for tier 1 teams)
    if (!isTier1 && !eligibility.canAddPlayer) {
      return next(
        new BadRequestError("Player is not eligible to be added to this team")
      );
    }

    // 6. Verify player has valid profile (required for all teams)
    const playerProfile = await getPlayerDetailsForDashboardBySteamId(steamId);
    if (
      !playerProfile ||
      !playerProfile.account_id ||
      !playerProfile.nickname ||
      !playerProfile.work_email_verified ||
      !playerProfile.is_valid_full_name ||
      !playerProfile.is_valid_work_email
    ) {
      return next(
        new BadRequestError(
          "Cannot add player: Profile validation is required. The player must have a verified Kanahub profile with valid email and full name before being added to a team."
        )
      );
    }

    // 7. Set the player's kana_elo from the eligibility check
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

    // 8. Finally add the player to the team in SeasonTeamPlayers
    await insertSeasonTeamPlayer(
      seasonId,
      teamId,
      { steam_id: steamId } satisfies InsertSeasonTeamPlayer,
      connection
    );

    await connection.commit();

    res.status(200).json({
      message: "Player successfully added to the team",
      steam_id: steamId,
      team_id: teamId,
      season_id: seasonId,
      kana_elo,
      context: "finalized"
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
                discord_linked: Boolean(playerData.value.discord_linked),
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

export const addSubstitutePlayerController = async (
  req: RequestWithParamsAndBody<
    {
      season_id: string;
      team_id: string;
      steam_id: string;
    },
    { match_id: string }
  >,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);
  const steamId = req.params.steam_id;
  const { match_id } = req.body;

  if (!match_id) {
    return next(new BadRequestError("match_id is required"));
  }

  const resolvedMatchId = await resolveMatchId(match_id.toString(), seasonId);

  await ensureMatchIdAndTeamIdMatches(resolvedMatchId, teamId);

  const insertData = {
    steam_id: steamId,
    role: "substitute",
    match_id: resolvedMatchId
  } satisfies InsertSeasonTeamPlayer;
  await insertSeasonTeamPlayer(seasonId, teamId, insertData);

  res.status(200).json({
    message: "Substitute player successfully added to the team",
    steam_id: steamId,
    team_id: teamId,
    season_id: seasonId,
    role: "substitute",
    match_id: resolvedMatchId || null
  });
};

/**
 * Controller to prepare a player for signup by creating/updating account and SteamPlayers profile
 * with fake data. Sets work_email_verified to true but does NOT set UserPolicyAcceptance.
 * This allows accepting teams from signup drafts when players don't have complete account data.
 */
export const preparePlayerForSignupController = async (
  req: RequestWithParams<{
    steam_id: string;
  }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const steamId = req.params.steam_id;

  // Normalize Steam ID (handles SteamID64, SteamID, SteamID3, and URLs)
  let normalizedSteamId: string;
  try {
    normalizedSteamId = normalizeSteamId(steamId);
  } catch (error) {
    return next(error);
  }

  try {
    const result = await preparePlayerForSignup(normalizedSteamId);
    res.status(200).json({
      message: result.changes_made
        ? "Player prepared for signup successfully"
        : "Profile was already valid, no changes were made",
      account_id: result.account_id,
      steam_id: result.steam_id,
      changes_made: result.changes_made
    });
  } catch (error) {
    return next(error);
  }
};
