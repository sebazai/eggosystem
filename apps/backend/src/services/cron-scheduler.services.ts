import * as cron from "node-cron";
import {
  syncFaceitChampionshipMatches,
  getFaceITMatchDetails
} from "./faceit.services";
import { logger } from "../utils/app-logger";
import { runQuery } from "../db/mysqlRunQuery";
import { getFaceitMatchesForFaceitLeague } from "./standings.services";
import { type SeasonLeagueExternalId } from "@eggosystem/types";
import { getSeasonLeagueTeamByExternalId } from "../models/season-league-team.models";
import { getConnection } from "../db/mysqlConnection";
import {
  type ChampionshipDetailsObjectCreated,
  FaceitMatchStatus,
  validateChampionshipDetailsObjectCreated
} from "@eggosystem/types";
import { getSeasonLeagueExternalIdByExternalIdWithSeasonSettings } from "../models/season-league-external-id.models";
import { NotFoundError } from "../utils/errors";

const _syncMatchesManualGroup = async (type: string): Promise<void> => {
  const seasonLeagueExternalIds = await runQuery<SeasonLeagueExternalId[]>(
    "SELECT * FROM SeasonLeagueExternalIds"
  );
  for (const seasonLeagueExternalId of seasonLeagueExternalIds) {
    if (!seasonLeagueExternalId.manual_group) {
      continue;
    }

    // Fetch all matches using pagination
    const allMatches = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const matches = await getFaceitMatchesForFaceitLeague(
        seasonLeagueExternalId.external_id,
        type,
        limit,
        offset
      );

      if (matches.length === 0) {
        break;
      }

      allMatches.push(...matches);

      // If we got fewer matches than the limit, we've reached the end
      if (matches.length < limit) {
        break;
      }

      offset += limit;
    }

    for (const match of allMatches) {
      await runQuery(
        `UPDATE Matches SET \`group\` = ? WHERE external_match_room_id = ?`,
        [seasonLeagueExternalId.manual_group, match.match_id]
      );
    }
  }
};

/**
 * Starts the FACEIT match sync cron job
 * Runs every 6 hours at minutes 0 (00:00, 06:00, 12:00, 18:00)
 */
export const startFaceitMatchSyncCron = (): void => {
  // Schedule to run every 3 hours
  // Cron expression: "0 */3 * * *" means at minute 0 of every 3th hour
  cron.schedule(
    "0 */3 * * *",
    async () => {
      const startTime = new Date();
      logger.info(
        `[${startTime.toISOString()}] Starting scheduled FACEIT match sync...`
      );

      try {
        await syncFaceitChampionshipMatches();
        await validateAndUpdateScheduledMatchTeams();
        // await syncMatchesManualGroup("past");
        // await syncMatchesManualGroup("upcoming");
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        logger.info(
          `[FACEIT CRON] FACEIT match sync completed successfully. Duration: ${duration}ms`
        );
      } catch (error) {
        logger.error(`[FACEIT CRON] FACEIT match sync failed:`, error);
      }
    },
    {
      timezone: "Europe/Helsinki" // Set to Finnish timezone for consistency
    }
  );

  logger.info(
    "FACEIT match sync cron job started. Will run every 3 hours (Helsinki time)"
  );
};

export const triggerManualFaceitSync = async (
  season_id: number
): Promise<void> => {
  logger.info("Manual FACEIT match sync triggered...");
  // await syncMatchesManualGroup("past");
  // await syncMatchesManualGroup("upcoming");
  await syncFaceitChampionshipMatches(season_id);
};

/**
 * Validates and updates teams for SCHEDULED matches when they mismatch with FaceIT
 * This handles the case where a match was abandoned, FaceIT created the next match,
 * but then the abandoned match was restarted and won by a different team.
 */
export const validateAndUpdateScheduledMatchTeams = async (): Promise<void> => {
  logger.info("Starting scheduled match team validation...");

  // Get all SCHEDULED matches for FaceIT seasons
  const scheduledMatches = await runQuery<
    Array<{
      id: number;
      external_match_room_id: string;
      season_id: number;
      league_id: number;
    }>
  >(
    `SELECT m.id, m.external_match_room_id, m.season_id, m.league_id
     FROM Matches m
     JOIN Seasons s ON m.season_id = s.id
     WHERE m.status = 'SCHEDULED'
       AND m.external_match_room_id IS NOT NULL
       AND s.platform = 'faceit'`
  );

  logger.info(`Found ${scheduledMatches.length} SCHEDULED matches to validate`);

  for (const match of scheduledMatches) {
    try {
      // Fetch match details from FaceIT API
      const rawMatchDetails = await getFaceITMatchDetails<unknown>(
        match.external_match_room_id
      );

      // Validate the response matches expected structure
      let faceitMatchDetails: ChampionshipDetailsObjectCreated;
      try {
        faceitMatchDetails =
          validateChampionshipDetailsObjectCreated(rawMatchDetails);
      } catch (validationError) {
        logger.warn(
          `Match ${match.external_match_room_id} response validation failed:`,
          validationError
        );
        continue;
      }

      // Skip if match is not SCHEDULED in FaceIT (might have been updated)
      if (faceitMatchDetails.status !== FaceitMatchStatus.SCHEDULED) {
        logger.info(
          `Match ${match.external_match_room_id} is not SCHEDULED in FaceIT (status: ${faceitMatchDetails.status}), skipping`
        );
        continue;
      }

      const externalLeagueId = faceitMatchDetails.competition_id;
      const seasonExternalLeagueRow =
        await getSeasonLeagueExternalIdByExternalIdWithSeasonSettings(
          externalLeagueId
        );
      if (!seasonExternalLeagueRow) {
        throw new NotFoundError(
          `Could not find season external league row for id ${externalLeagueId}`
        );
      }

      // Get teams from FaceIT match details
      const faceitTeam1ExternalId =
        faceitMatchDetails.teams.faction1.faction_id;
      const faceitTeam2ExternalId =
        faceitMatchDetails.teams.faction2.faction_id;

      // Get teams from database
      const dbTeam1 = await getSeasonLeagueTeamByExternalId(
        faceitTeam1ExternalId,
        seasonExternalLeagueRow.season_id
      );
      const dbTeam2 = await getSeasonLeagueTeamByExternalId(
        faceitTeam2ExternalId,
        seasonExternalLeagueRow.season_id
      );

      if (!dbTeam1 || !dbTeam2) {
        logger.warn(
          `Could not find SeasonLeagueTeam entries for external_ids: ${faceitTeam1ExternalId} or ${faceitTeam2ExternalId}`
        );
        continue;
      }

      // Get current teams in database for this match
      const currentMatchTeams = await runQuery<Array<{ team_id: number }>>(
        `SELECT team_id FROM MatchTeams WHERE match_id = ?`,
        [match.id]
      );

      const currentTeamIds = currentMatchTeams.map((mt) => mt.team_id);
      const expectedTeamIds = [dbTeam1.team_id, dbTeam2.team_id].sort(
        (a, b) => a - b
      );
      const currentTeamIdsSorted = [...currentTeamIds].sort((a, b) => a - b);

      // Check if teams match
      const teamsMatch =
        currentTeamIdsSorted.length === expectedTeamIds.length &&
        currentTeamIdsSorted.every(
          (id, index) => id === expectedTeamIds[index]
        );

      if (teamsMatch) {
        logger.debug(
          `Match ${match.external_match_room_id} teams are correct, skipping`
        );
        continue;
      }

      // Teams don't match, update them
      logger.info(
        `Match ${match.external_match_room_id} teams mismatch. Current: [${currentTeamIds.join(", ")}], Expected: [${expectedTeamIds.join(", ")}]. Updating...`
      );

      const connection = await getConnection();
      try {
        await connection.beginTransaction();

        // Delete existing MatchTeams entries
        await runQuery(
          `DELETE FROM MatchTeams WHERE match_id = ?`,
          [match.id],
          connection
        );

        // Insert correct teams
        await runQuery(
          `INSERT INTO MatchTeams (match_id, team_id, season_id, league_id, match_side)
           VALUES (?, ?, ?, ?, 'home'),
                  (?, ?, ?, ?, 'away')`,
          [
            match.id,
            dbTeam1.team_id,
            match.season_id,
            match.league_id,
            match.id,
            dbTeam2.team_id,
            match.season_id,
            match.league_id
          ],
          connection
        );

        await connection.commit();
        logger.info(
          `Successfully updated teams for match ${match.external_match_room_id}`
        );
      } catch (error) {
        await connection.rollback();
        logger.error(
          `Failed to update teams for match ${match.external_match_room_id}:`,
          error
        );
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      logger.error(
        `Error validating match ${match.external_match_room_id}:`,
        error
      );
    }
  }

  logger.info("Scheduled match team validation completed.");
};
