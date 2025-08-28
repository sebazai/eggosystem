import {
  getTeamValuesForSorter,
  getTeamPlayerValuesForSortter,
  getTeamsForSeason,
  checkPlayerAdditionEligibility
} from "../../models/sortter.models";
import type { RequestWithParams, TeamSortterValues } from "@eggosystem/types";
import { NotFoundError, BadRequestError } from "../../utils/errors";
import { setPlayerKanaElo } from "../../models/player.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { insertFaceITPlayerRankForSeason } from "../../models/season-player-ranks.models";
import { getPlayerHoursForSteamAppId } from "../../services/player-ranks.services";
import { getFaceITCS2Rank } from "../../services/faceit.services";
import { getCSRank } from "../../services/player-ranks.services";
import { getConnection } from "../../db/mysqlConnection";
import { insertSeasonTeamPlayer } from "../../models/season-team-players.models";
import { type Request, type Response, type NextFunction } from "express";
import {
  getTeamFlags,
  createTeamFlagsFromDatabase
} from "../../services/elo.services";

/**
 * Controller to get team values for sorter functionality
 * This returns all teams for a given season with their values:
 * - team name
 * - top 5 players kanaelo sum
 * - top 4 players kanaelo average
 * - team league
 * - kanaelo values for top 5 players
 */
export const getTeamValuesController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);

  const teamValues = await getTeamValuesForSorter(seasonId);
  res.json(teamValues);
};

/**
 * Controller to get team values for a specific team
 * Returns a single team's values for sorter functionality
 */
export const getTeamValueByIdController = async (
  req: RequestWithParams<{ season_id: string; team_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);

  const teamValues = await getTeamValuesForSorter(seasonId);
  const team = teamValues.find(
    (team: TeamSortterValues) => team.team_id === teamId
  );

  if (!team) {
    return next(
      new NotFoundError(
        `Team with ID ${teamId} not found for season ${seasonId}`
      )
    );
  }

  res.json(team);
};

/**
 * Controller to get player values for a specific team in a season
 * Returns all players for a given team with their values:
 * - name
 * - steamid
 * - cs2 rank
 * - faceit level
 * - faceit elo
 * - hours
 * - kanarating (avg from all games player played)
 * - fkd (faceit k/d ratio)
 *
 * Converts null values to 0 for numeric fields in the response
 */
export const getTeamPlayerValuesController = async (
  req: RequestWithParams<{ season_id: string; team_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);

  const playerValues = await getTeamPlayerValuesForSortter(seasonId, teamId);

  if (playerValues.length === 0) {
    return next(
      new NotFoundError(
        `No players found for team ${teamId} in season ${seasonId}`
      )
    );
  }

  // Convert null values to 0 for the response
  const formattedPlayerValues = playerValues.map((player) => ({
    name: player.name,
    steamid: player.steamid,
    cs2_rank: player.cs2_rank ?? 0,
    faceit_level: player.faceit_level ?? 0,
    faceit_elo: player.faceit_elo ?? 0,
    hours: player.hours ?? 0,
    kanarating: player.kanarating ?? 0,
    fkd: player.fkd ?? 0,
    kana_elo: player.kana_elo ?? 0,
    calculus: player.calculus ?? null
  }));

  res.json(formattedPlayerValues);
};

/**
 * Controller to get all teams for a specific season
 * Returns teams with their league information
 */
export const getTeamsForSeasonController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);

  const teams = await getTeamsForSeason(seasonId);
  res.json(teams);
};

/**
 * Controller to check if a player can be added to a team
 * Returns analysis of the player's impact on team balance
 */
export const checkPlayerAdditionEligibilityController = async (
  req: RequestWithParams<{
    season_id: string;
    team_id: string;
    steam_id: string;
  }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamId = Number(req.params.team_id);
  const steamId = req.params.steam_id;

  const eligibility = await checkPlayerAdditionEligibility(
    seasonId,
    teamId,
    steamId
  );
  res.json(eligibility);
};

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

export const getTeamFlagsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all team flags from Redis
    const teamFlags = await getTeamFlags();

    res.json(teamFlags);
  } catch (error) {
    next(error);
  }
};

export const refreshTeamFlagsFromDatabaseController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Force refresh from database by calling getTeamFlags
    // This will trigger createTeamFlagsFromDatabase if no flags exist
    const teamFlags = await getTeamFlags();

    res.json({
      message: "Team flags refreshed from database",
      count: teamFlags.length,
      flags: teamFlags
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTeamFlagsForSeasonController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const seasonId = Number(req.params.season_id);

    // Create flags specifically for this season
    await createTeamFlagsFromDatabase(seasonId);

    // Get the updated flags
    const teamFlags = await getTeamFlags();

    res.json({
      message: `Team flags refreshed for season ${seasonId}`,
      count: teamFlags.length,
      flags: teamFlags
    });
  } catch (error) {
    next(error);
  }
};
