import { type Response } from "express";
import type {
  RequestWithParams,
  RequestWithParamsAndBody
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
  isPlacementsFinalized
} from "../services/sortter-placements.services";
import { runQuery } from "../db/mysqlRunQuery";

/**
 * Controller to get preliminary team placements
 */
export const getPreliminaryPlacementsController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  const seasonId = Number(req.params.season_id);

  // Check if placements have been finalized
  const isFinalized = await isPlacementsFinalized(seasonId);

  // First, check if we have historical data in SeasonLeagueTeams
  const query = `
      SELECT COUNT(*) as count
      FROM SeasonLeagueTeams
      WHERE season_id = ?
    `;

  const result = await runQuery<Array<{ count: number }>>(query, [seasonId]);
  const hasHistoricalData = result.length > 0 && result[0].count > 0;

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
          slt.tier AS tier
        FROM Teams t
        JOIN SeasonLeagueTeams slt ON slt.team_id = t.id
        JOIN Leagues l ON l.id = slt.league_id
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

    // Get team values for avg4/sum5 calculations
    // For historical data, we don't need to filter by approved=true
    const teams = await getTeamValuesForSorter(seasonId, {
      isHistorical: true
    });

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
  const teams = await getTeamValuesForSorter(seasonId, { isHistorical: true }); // Use historical=true to get all teams
  logger.info(`Retrieved ${teams.length} teams for initial placements`);

  if (teams.length === 0) {
    logger.warn(
      `No teams found for season ${seasonId} - cannot generate initial placements`
    );
    res.status(404).json({
      error: { message: "No teams found for this season" }
    });
    return;
  }

  const initialPlacements = generateInitialPlacements(teams);
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
  res: Response
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
      res.status(400).json({
        error: { message: "Placements must be an array" }
      });
      return;
    }

    // Check if placements have been finalized
    const isFinalized = await isPlacementsFinalized(seasonId);
    if (isFinalized) {
      logger.warn("Attempted to save finalized placements", { seasonId });
      res.status(403).json({
        error: {
          message: "Placements have been finalized and cannot be modified"
        }
      });
      return;
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
    res.status(500).json({
      error: { message: "Failed to save preliminary placements" }
    });
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
  res: Response
): Promise<void> => {
  try {
    const seasonId = Number(req.params.season_id);

    // Check if placements have already been finalized
    const isFinalized = await isPlacementsFinalized(seasonId);
    if (isFinalized) {
      res.status(403).json({
        error: { message: "Placements have already been finalized" }
      });
      return;
    }

    // Get placements from Redis
    const placements = await getPreliminaryPlacements(seasonId);

    if (!placements || placements.length === 0) {
      res.status(404).json({
        error: { message: "No preliminary placements found for this season" }
      });
      return;
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
      res.status(403).json({
        error: {
          message:
            "Cannot finalize placements: Some teams already exist in SeasonLeagueTeams",
          details: `Teams with IDs ${existingTeamIds.join(", ")} already exist in SeasonLeagueTeams for this season. Finalization is only allowed for new insertions.`
        }
      });
      return;
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

    logger.info(
      `Finalized ${results.length} team placements for season ${seasonId}`
    );

    // Mark the placements as finalized in Redis
    await setPlacementsFinalized(seasonId, true);

    // Delete the preliminary placements from Redis - we keep the finalized flag
    await deletePreliminaryPlacements(seasonId);

    res.json({
      message: "Team placements finalized successfully",
      season_id: seasonId,
      teams_updated: placements.length
    });
  } catch (error) {
    logger.error("Error finalizing team placements", error);
    res.status(500).json({
      error: { message: "Failed to finalize team placements" }
    });
  }
};

/**
 * Controller to check if placements have been finalized
 */
export const getPlacementsFinalizationStatusController = async (
  req: RequestWithParams<{ season_id: string }>,
  res: Response
): Promise<void> => {
  try {
    const seasonId = Number(req.params.season_id);
    const isFinalized = await isPlacementsFinalized(seasonId);

    res.json({ isFinalized });
  } catch (error) {
    logger.error("Error checking finalization status", error);
    res.status(500).json({
      error: { message: "Failed to check finalization status" }
    });
  }
};
