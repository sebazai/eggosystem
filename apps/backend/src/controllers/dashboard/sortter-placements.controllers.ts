import { type Response, type NextFunction } from "express";
import {
  SeasonPlatform,
  type RequestWithParams,
  type RequestWithParamsAndBody,
  type RequestWithParamsAndQuery,
  type SeasonTeamRegistration
} from "@eggosystem/types";
import { logger } from "../../utils/app-logger";
import { getTeamValuesForSortter } from "../../models/dashboard/sortter.models";
import {
  savePreliminaryPlacements,
  getPreliminaryPlacements,
  generateInitialPlacements,
  deletePreliminaryPlacements,
  type TeamPlacement,
  setPlacementsFinalized,
  isPlacementsFinalized,
  hasSeasonLeagueTeamsForSeason
} from "../../services/sortter-placements.services";
import { enqueueSeasonFinalizationWelcomeEmails } from "../../services/email.services";
import { runQuery } from "../../db/mysqlRunQuery";
import { type ResultSetHeader } from "mysql2/promise";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  InternalServerError
} from "../../utils/errors";
import { getConnection } from "../../db/mysqlConnection";
import _ from "lodash";
import { getSeasonById } from "../../models/season.models";

/**
 * Controller to get preliminary team placements
 */
export const getPreliminaryPlacementsController = async (
  req: RequestWithParamsAndQuery<
    { season_id: string },
    { teams_per_division: string }
  >,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = Number(req.params.season_id);
  const teamsPerDivisionQueryNumber = Number(req.query.teams_per_division);

  if (isNaN(teamsPerDivisionQueryNumber)) {
    throw new BadRequestError("Teams per division must be a number.");
  }

  // Check if placements have been finalized
  const isFinalized = await isPlacementsFinalized(seasonId);

  const hasHistoricalData = await hasSeasonLeagueTeamsForSeason(seasonId);

  if (hasHistoricalData) {
    logger.info(
      `Found historical league data for season ${seasonId}, using that as source`
    );

    // Get teams with their league assignments from SeasonLeagueTeams
    const teamsQuery = `
        SELECT 
          t.id AS team_id,
          t.name AS team_name,
          l.name AS league_name,
          l.id AS league_id,
          sl.tier AS tier
        FROM Teams t
        JOIN SeasonLeagueTeams slt ON slt.team_id = t.id
        JOIN SeasonLeagues sl ON sl.league_id = slt.league_id
        JOIN Leagues l ON l.id = sl.league_id
        WHERE slt.season_id = ?
      `;

    const teamsWithLeagues = await runQuery<
      Array<{
        team_id: number;
        team_name: string;
        league_name: string;
        league_id: number;
        tier: number;
      }>
    >(teamsQuery, [seasonId]);

    const teams = await getTeamValuesForSortter(seasonId);

    // Merge the league data with the team values
    const historicalPlacements = teamsWithLeagues.map((team) => {
      // Find the corresponding team in the team values
      const teamValues = teams.find((t) => t.team_id === team.team_id);

      return {
        team_id: team.team_id,
        team_name: team.team_name,
        division: team.tier,
        comments: "",
        original_avg: teamValues?.avg5 || 0,
        original_position: 0 // Not relevant for historical data
      };
    });

    logger.info(
      `Returning ${historicalPlacements.length} historical placements for season ${seasonId}`
    );
    res.json({
      placements: historicalPlacements,
      isFinalized: isFinalized || true // Historical data is always considered finalized
    });
    return;
  }

  // If no historical data, try to get existing placements from Redis
  const existingPlacements = await getPreliminaryPlacements(seasonId);

  if (existingPlacements) {
    logger.info(
      `Returning ${existingPlacements.length} existing placements from Redis for season ${seasonId}`
    );
    res.json({
      placements: existingPlacements,
      isFinalized
    });
    return;
  }

  logger.info(
    `No existing placements found for season ${seasonId}, generating initial placements`
  );

  // If no placements exist, generate initial placements from team values
  logger.info(
    `Getting team values for season ${seasonId} to generate initial placements`
  );
  const teams = await getTeamValuesForSortter(seasonId);
  logger.info(`Retrieved ${teams.length} teams for initial placements`);

  if (teams.length === 0) {
    logger.warn(
      `No teams found for season ${seasonId} - cannot generate initial placements`
    );
    return next(new NotFoundError("No teams found for this season"));
  }

  // CRITICAL FIX: Check if teams have valid kana_elo data before generating placements
  const teamsWithValidKanaElo = teams.filter(
    (team) => team.avg5 !== null && team.avg5 !== undefined && !isNaN(team.avg5)
  );

  if (teamsWithValidKanaElo.length === 0) {
    logger.warn(
      `Teams found for season ${seasonId} but no valid kana_elo data available - kanaelo calculation may not be complete`
    );
    return next(
      new BadRequestError(
        "Cannot generate placements: kana_elo data has not been calculated yet. Please complete the kanaelo calculation process first."
      )
    );
  }

  if (teamsWithValidKanaElo.length < teams.length) {
    logger.warn(
      `Some teams for season ${seasonId} have invalid kana_elo data. Valid teams: ${teamsWithValidKanaElo.length}, Total teams: ${teams.length}`
    );
    return next(
      new BadRequestError(
        "Cannot generate placements: some teams are missing kana_elo data. Please ensure all players have completed kanaelo calculation."
      )
    );
  }

  logger.info(
    `All ${teams.length} teams have valid kana_elo data, proceeding with placement generation`
  );

  const initialPlacements = generateInitialPlacements(
    teams,
    teamsPerDivisionQueryNumber
  );
  logger.info(`Generated ${initialPlacements.length} initial placements`);

  // Save the initial placements to Redis
  await savePreliminaryPlacements(seasonId, initialPlacements);

  res.json({
    placements: initialPlacements,
    isFinalized: false
  });
};

/**
 * Controller to save preliminary team placements
 */
export const savePreliminaryPlacementsController = async (
  req: RequestWithParamsAndBody<
    { season_id: string },
    { placements: TeamPlacement[] }
  >,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const seasonId = Number(req.params.season_id);
    const { placements } = req.body;

    if (!Array.isArray(placements)) {
      logger.warn("Invalid placements data - not an array", { placements });
      return next(new BadRequestError("Placements must be an array"));
    }

    // Check if placements have been finalized
    const isFinalized = await isPlacementsFinalized(seasonId);
    if (isFinalized) {
      logger.warn("Attempted to save finalized placements", { seasonId });
      return next(
        new ForbiddenError(
          "Placements have been finalized and cannot be modified"
        )
      );
    }

    logger.info("Saving preliminary placements", {
      seasonId,
      placementCount: placements.length
    });

    await savePreliminaryPlacements(seasonId, placements);

    logger.info("Preliminary placements saved successfully", { seasonId });

    res.json({
      message: "Preliminary placements saved successfully",
      season_id: seasonId
    });
  } catch (error) {
    logger.error("Error saving preliminary placements", error);
    return next(
      new InternalServerError("Failed to save preliminary placements")
    );
  }
};

/**
 * Get division name based on division number
 */
const getDivisionName = (division: number): string => {
  switch (division) {
    case 1:
      return "Masters";
    case 2:
      return "Challengers";
    case 3:
      return "Prospects";
    default:
      return `div${division}`;
  }
};

/**
 * Controller to finalize team placements to the database
 */
export const finalizeTeamPlacementsController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const seasonId = Number(req.params.season_id);

    const season = await getSeasonById(seasonId, connection);
    if (!season) {
      throw new BadRequestError(`Season ${seasonId} not found`);
    }

    // Check if placements have already been finalized
    const isFinalized = await isPlacementsFinalized(seasonId);
    if (isFinalized) {
      return next(new ForbiddenError("Placements have already been finalized"));
    }

    // Get placements from Redis
    const placements = await getPreliminaryPlacements(seasonId);

    if (!placements || placements.length === 0) {
      return next(
        new NotFoundError("No preliminary placements found for this season")
      );
    }

    // PRE-FLIGHT VALIDATION: Ensure all players in approved registrations have SeasonPlayerRanks
    const playersWithoutRanksQuery = `
      SELECT 
        strp.steam_id, 
        strp.team_id,
        t.name as team_name,
        sp.nickname
      FROM SeasonTeamRegistrationPlayers strp
      INNER JOIN SeasonTeamRegistrations str 
        ON str.season_id = strp.season_id AND str.team_id = strp.team_id
      LEFT JOIN SeasonPlayerRanks spr 
        ON spr.steam_id = strp.steam_id AND spr.season_id = strp.season_id
      LEFT JOIN Teams t ON t.id = strp.team_id
      LEFT JOIN SteamPlayers sp ON sp.steam_id = strp.steam_id
      WHERE strp.season_id = ? AND str.approved = 1 AND spr.id IS NULL
    `;
    const playersWithoutRanks = await runQuery<
      Array<{
        steam_id: string;
        team_id: number;
        team_name: string | null;
        nickname: string | null;
      }>
    >(playersWithoutRanksQuery, [seasonId], connection);

    if (playersWithoutRanks.length > 0) {
      const missingPlayersList = playersWithoutRanks
        .map(
          (p) =>
            `${p.nickname || p.steam_id} (team: ${p.team_name || p.team_id})`
        )
        .join(", ");
      logger.error(
        `Cannot finalize: ${playersWithoutRanks.length} players missing SeasonPlayerRanks: ${missingPlayersList}`
      );
      return next(
        new BadRequestError(
          `Cannot finalize placements: ${playersWithoutRanks.length} player(s) are missing rank data. ` +
            `Please ensure all players have completed rank processing. Missing: ${missingPlayersList}`
        )
      );
    }

    // Also check for players with null critical rank values
    const playersWithNullRanksQuery = `
      SELECT 
        strp.steam_id, 
        strp.team_id,
        t.name as team_name,
        sp.nickname,
        spr.cs2_rank,
        spr.cs_hours,
        spr.kana_elo
      FROM SeasonTeamRegistrationPlayers strp
      INNER JOIN SeasonTeamRegistrations str 
        ON str.season_id = strp.season_id AND str.team_id = strp.team_id
      INNER JOIN SeasonPlayerRanks spr 
        ON spr.steam_id = strp.steam_id AND spr.season_id = strp.season_id
      LEFT JOIN Teams t ON t.id = strp.team_id
      LEFT JOIN SteamPlayers sp ON sp.steam_id = strp.steam_id
      WHERE strp.season_id = ? AND str.approved = 1 
        AND (spr.kana_elo IS NULL OR spr.kana_elo = 0)
    `;
    const playersWithNullRanks = await runQuery<
      Array<{
        steam_id: string;
        team_id: number;
        team_name: string | null;
        nickname: string | null;
        cs2_rank: number | null;
        cs_hours: number | null;
        kana_elo: number | null;
      }>
    >(playersWithNullRanksQuery, [seasonId], connection);

    if (playersWithNullRanks.length > 0) {
      const incompletePlayersList = playersWithNullRanks
        .map(
          (p) =>
            `${p.nickname || p.steam_id} (team: ${p.team_name || p.team_id}, kana_elo: ${p.kana_elo ?? "NULL"})`
        )
        .join(", ");
      logger.error(
        `Cannot finalize: ${playersWithNullRanks.length} players have incomplete rank data: ${incompletePlayersList}`
      );
      return next(
        new BadRequestError(
          `Cannot finalize placements: ${playersWithNullRanks.length} player(s) have incomplete rank data (missing kana_elo). ` +
            `Please ensure kana_elo calculation is complete. Incomplete: ${incompletePlayersList}`
        )
      );
    }

    logger.info(
      `Pre-flight validation passed: all players have complete SeasonPlayerRanks data`
    );

    // Create a map to track which league IDs we need to process
    const requiredLeagues = new Map<
      number,
      { name: string; leagueId: number }
    >();

    // Collect all the required leagues
    for (const placement of _.uniqBy(placements, "division")) {
      const leagueName = getDivisionName(placement.division);

      // Get league_id from name
      const leagueQuery = `SELECT id FROM Leagues WHERE name = ? LIMIT 1`;
      const leagueResult = await runQuery<Array<{ id: number }>>(
        leagueQuery,
        [leagueName],
        connection
      );

      if (!leagueResult || leagueResult.length === 0) {
        logger.error(`League with name "${leagueName}" not found`);
        return next(
          new BadRequestError(`League with name "${leagueName}" not found`)
        );
      }

      const leagueId = leagueResult[0].id;
      requiredLeagues.set(placement.division, {
        name: leagueName,
        leagueId: leagueId
      });
    }

    for (const [
      division,
      { name: leagueName, leagueId }
    ] of requiredLeagues.entries()) {
      logger.info(
        `Creating SeasonLeagues entry for season ${seasonId}, league ${leagueName} (ID: ${leagueId}), tier ${division}`
      );
      const createSeasonLeagueQuery = `
          INSERT INTO SeasonLeagues (season_id, league_id, tier)
          VALUES (?, ?, ?)
        `;
      await runQuery(
        createSeasonLeagueQuery,
        [seasonId, leagueId, division],
        connection
      );
    }

    // Now handle the team placements - insert only, no updates
    const insertPromises = placements.map(async (placement) => {
      const requiredLeague = requiredLeagues.get(placement.division);
      if (!requiredLeague) {
        throw new BadRequestError(
          `League with division ${placement.division} not found`
        );
      }
      const { leagueId, name: leagueName } = requiredLeague;

      const externalPlatformIdQuery = `
        SELECT external_platform_id 
        FROM SeasonTeamRegistrations 
        WHERE season_id = ? AND team_id = ?
      `;
      const [externalPlatformIdResult] = await runQuery<
        Array<{
          external_platform_id: SeasonTeamRegistration["external_platform_id"];
        }>
      >(externalPlatformIdQuery, [seasonId, placement.team_id], connection);

      const externalPlatformId = externalPlatformIdResult.external_platform_id;

      const insertQuery = `
        INSERT INTO SeasonLeagueTeams (season_id, team_id, league_id, external_team_id)
        VALUES (?, ?, ?, ?)
      `;
      logger.info(
        `Inserting team ${placement.team_id} into league ${leagueName} (ID: ${leagueId})`
      );
      if (season.platform !== SeasonPlatform.Kanaliiga) {
        if (!externalPlatformId) {
          return next(
            new BadRequestError(
              `Team ${placement.team_id} does not have an external platform ID, required for ${season.platform} platform`
            )
          );
        }
        return runQuery(
          insertQuery,
          [seasonId, placement.team_id, leagueId, externalPlatformId],
          connection
        );
      } else {
        return runQuery(
          insertQuery,
          [seasonId, placement.team_id, leagueId, null],
          connection
        );
      }
    });

    const results = await Promise.all(insertPromises);

    logger.info(
      `Copying players from SeasonTeamRegistrationPlayers to SeasonTeamPlayers for season ${seasonId}`
    );

    // Copy all players from approved teams
    const copyPlayersQuery = `
        INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain)
        SELECT 
          strp.season_id,
          strp.team_id,
          strp.steam_id,
          'primary' as role,
          strp.is_captain,
          strp.is_co_captain
        FROM SeasonTeamRegistrationPlayers strp
        INNER JOIN SeasonTeamRegistrations str ON str.season_id = strp.season_id AND str.team_id = strp.team_id
        WHERE strp.season_id = ? AND str.approved = 1
      `;

    const playersCopyResult = await runQuery<ResultSetHeader>(
      copyPlayersQuery,
      [seasonId],
      connection
    );
    logger.info(
      `Copied ${playersCopyResult.affectedRows || 0} players to SeasonTeamPlayers for season ${seasonId}`
    );

    logger.info(
      `Finalized ${results.length} team placements for season ${seasonId}`
    );

    await connection.commit();

    // Mark the placements as finalized in Redis
    await setPlacementsFinalized(seasonId, true);

    // Delete the preliminary placements from Redis - we keep the finalized flag
    await deletePreliminaryPlacements(seasonId);

    // Enqueue welcome emails for rate-limited sending (async, don't block response)
    void enqueueSeasonFinalizationWelcomeEmails(seasonId, season);

    res.json({
      message: "Team placements and players finalized successfully",
      season_id: seasonId,
      teams_updated: placements.length,
      players_copied: playersCopyResult.affectedRows,
      details: {
        season_leagues_created: requiredLeagues.size,
        season_league_teams_created: results.length,
        season_team_players_created: playersCopyResult.affectedRows
      }
    });
  } catch (error) {
    await connection.rollback();
    logger.error("Error finalizing team placements", error);
    return next(new InternalServerError("Failed to finalize team placements"));
  } finally {
    connection.release();
  }
};

/**
 * Controller to check if placements have been finalized
 */
export const getPlacementsFinalizationStatusController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const seasonId = Number(req.params.season_id);
    const isFinalized = await isPlacementsFinalized(seasonId);

    res.json({ isFinalized });
  } catch (error) {
    logger.error("Error checking finalization status", error);
    return next(new InternalServerError("Failed to check finalization status"));
  }
};
