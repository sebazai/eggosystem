import { type Response, type NextFunction } from "express";
import type {
  RequestWithParams,
  RequestWithParamsAndBody,
  RequestWithParamsAndQuery
} from "@eggosystem/types";
import { logger } from "../utils/app-logger";
import { getTeamValuesForSorter } from "../models/sortter.models";
import {
  savePreliminaryPlacements,
  getPreliminaryPlacements,
  generateInitialPlacements,
  deletePreliminaryPlacements,
  type TeamPlacement,
  setPlacementsFinalized,
  isPlacementsFinalized,
  hasSeasonLeagueTeamsForSeason
} from "../services/sortter-placements.services";
import { runQuery } from "../db/mysqlRunQuery";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  InternalServerError
} from "../utils/errors";

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

    const teams = await getTeamValuesForSorter(seasonId);

    // Merge the league data with the team values
    const historicalPlacements = teamsWithLeagues.map((team) => {
      // Find the corresponding team in the team values
      const teamValues = teams.find((t) => t.team_id === team.team_id);

      return {
        team_id: team.team_id,
        team_name: team.team_name,
        division: team.tier,
        comments: "",
        original_avg: teamValues?.avg4 || 0,
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
  const teams = await getTeamValuesForSorter(seasonId);
  logger.info(`Retrieved ${teams.length} teams for initial placements`);

  if (teams.length === 0) {
    logger.warn(
      `No teams found for season ${seasonId} - cannot generate initial placements`
    );
    return next(new NotFoundError("No teams found for this season"));
  }

  // CRITICAL FIX: Check if teams have valid kana_elo data before generating placements
  const teamsWithValidKanaElo = teams.filter(
    (team) => team.avg4 !== null && team.avg4 !== undefined && !isNaN(team.avg4)
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
    // Add debugging information
    logger.info("savePreliminaryPlacementsController called", {
      seasonId: req.params.season_id,
      auth: req.auth
        ? {
            account_id: req.auth.account_id,
            permissions: req.auth.permissions,
            roles: req.auth.roles
          }
        : "No auth",
      body: req.body
    });

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
  try {
    const seasonId = Number(req.params.season_id);

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

    // Check if any teams already exist in SeasonLeagueTeams - if so, we don't allow updates
    const existingTeamsQuery = `
      SELECT team_id 
      FROM SeasonLeagueTeams 
      WHERE season_id = ?
    `;
    const existingTeamsResult = await runQuery<Array<{ team_id: number }>>(
      existingTeamsQuery,
      [seasonId]
    );

    if (existingTeamsResult.length > 0) {
      const existingTeamIds = existingTeamsResult.map((team) => team.team_id);
      return next(
        new ForbiddenError(
          `Cannot finalize placements: Some teams already exist in SeasonLeagueTeams. Teams with IDs ${existingTeamIds.join(", ")} already exist in SeasonLeagueTeams for this season. Finalization is only allowed for new insertions.`
        )
      );
    }

    // First, ensure all required SeasonLeagues entries exist
    // Create a map to track which league IDs we need to process
    const requiredLeagues = new Map<
      number,
      { name: string; division: number }
    >();

    // Collect all the required leagues
    for (const placement of placements) {
      const leagueName = getDivisionName(placement.division);

      // Get league_id from name
      const leagueQuery = `SELECT id FROM Leagues WHERE name = ? LIMIT 1`;
      const leagueResult = await runQuery<Array<{ id: number }>>(leagueQuery, [
        leagueName
      ]);

      if (!leagueResult || leagueResult.length === 0) {
        logger.error(`League with name "${leagueName}" not found`);

        // Let's log all available leagues to help debug
        const allLeaguesQuery = `SELECT id, name FROM Leagues ORDER BY id`;
        const allLeagues = await runQuery<Array<{ id: number; name: string }>>(
          allLeaguesQuery,
          []
        );
        logger.info(
          `Available leagues: ${JSON.stringify(allLeagues.map((l) => `${l.id}:${l.name}`))}`
        );

        throw new Error(`League with name "${leagueName}" not found`);
      }

      const leagueId = leagueResult[0].id;

      // Add to our map if not already there
      if (!requiredLeagues.has(leagueId)) {
        requiredLeagues.set(leagueId, {
          name: leagueName,
          division: placement.division
        });
      }
    }

    // Now create all the required SeasonLeagues entries in one batch
    for (const [
      leagueId,
      { name: leagueName, division }
    ] of requiredLeagues.entries()) {
      // Check if the SeasonLeagues entry already exists
      const checkSeasonLeagueQuery = `
        SELECT COUNT(*) as count 
        FROM SeasonLeagues 
        WHERE season_id = ? AND league_id = ?
      `;

      const seasonLeagueResult = await runQuery<Array<{ count: number }>>(
        checkSeasonLeagueQuery,
        [seasonId, leagueId]
      );
      const seasonLeagueExists =
        seasonLeagueResult.length > 0 && seasonLeagueResult[0].count > 0;

      // If the SeasonLeagues entry doesn't exist, create it
      if (!seasonLeagueExists) {
        // Determine tier based on league name/division
        let tier = 0;
        if (leagueName === "Masters") {
          tier = 1;
        } else if (leagueName === "Challengers") {
          tier = 2;
        } else if (leagueName === "Prospects") {
          tier = 3;
        } else if (leagueName.startsWith("div")) {
          // For div4, div5, etc. use the number as tier
          const divNumber = parseInt(leagueName.replace("div", ""), 10);
          if (!isNaN(divNumber)) {
            tier = divNumber;
          } else {
            tier = division; // Fallback to the division number
          }
        } else {
          tier = division; // Default to division number
        }

        logger.info(
          `Creating SeasonLeagues entry for season ${seasonId}, league ${leagueName} (ID: ${leagueId}), tier ${tier}`
        );

        const createSeasonLeagueQuery = `
          INSERT INTO SeasonLeagues (season_id, league_id, tier)
          VALUES (?, ?, ?)
        `;

        await runQuery(createSeasonLeagueQuery, [seasonId, leagueId, tier]);
      }
    }

    // Now handle the team placements - insert only, no updates
    const insertPromises = placements.map(async (placement) => {
      // Convert division number to league name using custom names for first three divisions
      const leagueName = getDivisionName(placement.division);

      // Get league_id from name - we already validated these exist above
      const leagueQuery = `SELECT id FROM Leagues WHERE name = ? LIMIT 1`;
      const leagueResult = await runQuery<Array<{ id: number }>>(leagueQuery, [
        leagueName
      ]);
      const leagueId = leagueResult[0].id;

      // Get external_platform_id from SeasonTeamRegistrations if it exists
      const externalPlatformIdQuery = `
        SELECT external_platform_id 
        FROM SeasonTeamRegistrations 
        WHERE season_id = ? AND team_id = ?
      `;
      const externalPlatformIdResult = await runQuery<
        Array<{ external_platform_id: string | null }>
      >(externalPlatformIdQuery, [seasonId, placement.team_id]);
      const externalPlatformId =
        externalPlatformIdResult.length > 0
          ? externalPlatformIdResult[0].external_platform_id
          : null;

      // Insert new record - we already checked above that no records exist
      const insertQuery = `
        INSERT INTO SeasonLeagueTeams (season_id, team_id, league_id, external_team_id)
        VALUES (?, ?, ?, ?)
      `;
      logger.info(
        `Inserting team ${placement.team_id} into league ${leagueName} (ID: ${leagueId})`
      );
      return runQuery(insertQuery, [
        seasonId,
        placement.team_id,
        leagueId,
        externalPlatformId
      ]);
    });

    const results = await Promise.all(insertPromises);

    // Copy approved team players from SeasonTeamRegistrationPlayers to SeasonTeamPlayers
    logger.info(
      `Copying players from SeasonTeamRegistrationPlayers to SeasonTeamPlayers for season ${seasonId}`
    );

    // Get all approved teams for this season
    const approvedTeamsQuery = `
      SELECT team_id 
      FROM SeasonTeamRegistrations 
      WHERE season_id = ? AND approved = 1
    `;
    const approvedTeams = await runQuery<Array<{ team_id: number }>>(
      approvedTeamsQuery,
      [seasonId]
    );

    const approvedTeamIds = approvedTeams.map((team) => team.team_id);

    if (approvedTeamIds.length > 0) {
      // Check if any players already exist in SeasonTeamPlayers for this season
      const existingPlayersQuery = `
        SELECT DISTINCT team_id 
        FROM SeasonTeamPlayers 
        WHERE season_id = ? AND team_id IN (${approvedTeamIds.map(() => "?").join(", ")})
      `;
      const existingPlayersResult = await runQuery<Array<{ team_id: number }>>(
        existingPlayersQuery,
        [seasonId, ...approvedTeamIds]
      );

      if (existingPlayersResult.length > 0) {
        const existingTeamIds = existingPlayersResult.map(
          (team) => team.team_id
        );
        logger.warn(
          `Some teams already have players in SeasonTeamPlayers: ${existingTeamIds.join(", ")}`
        );
        throw new Error(
          `Cannot finalize placements: Some teams already have players in SeasonTeamPlayers. ` +
            `Teams with IDs ${existingTeamIds.join(", ")} already exist in SeasonTeamPlayers for this season. ` +
            `Finalization is only allowed for new insertions.`
        );
      }

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

      const playersCopyResult = await runQuery<{ affectedRows?: number }>(
        copyPlayersQuery,
        [seasonId]
      );
      logger.info(
        `Copied ${playersCopyResult.affectedRows || 0} players to SeasonTeamPlayers for season ${seasonId}`
      );
    }

    logger.info(
      `Finalized ${results.length} team placements for season ${seasonId}`
    );

    // Mark the placements as finalized in Redis
    await setPlacementsFinalized(seasonId, true);

    // Delete the preliminary placements from Redis - we keep the finalized flag
    await deletePreliminaryPlacements(seasonId);

    // Count total players copied
    let totalPlayersCopied = 0;
    if (approvedTeamIds.length > 0) {
      const playersCountQuery = `
        SELECT COUNT(*) as count 
        FROM SeasonTeamPlayers 
        WHERE season_id = ? AND team_id IN (${approvedTeamIds.map(() => "?").join(", ")})
      `;
      const playersCountResult = await runQuery<Array<{ count: number }>>(
        playersCountQuery,
        [seasonId, ...approvedTeamIds]
      );
      totalPlayersCopied = playersCountResult[0]?.count || 0;
    }

    res.json({
      message: "Team placements and players finalized successfully",
      season_id: seasonId,
      teams_updated: placements.length,
      players_copied: totalPlayersCopied,
      details: {
        season_leagues_created: requiredLeagues.size,
        season_league_teams_created: results.length,
        season_team_players_created: totalPlayersCopied
      }
    });
  } catch (error) {
    logger.error("Error finalizing team placements", error);
    return next(new InternalServerError("Failed to finalize team placements"));
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
