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
