import {
  type FaceitMatchesResponse,
  type FaceitMatch,
  MatchStatus
} from "@eggosystem/types";
import { logger } from "../utils/app-logger";
import {
  getFaceitMatchDateTime,
  adjustMatchDateTime
} from "../utils/date-utils";
import {
  getMatchesByExternalId,
  updateMatchStartAndEndTimestamp,
  updateMatchStatusByMatchId
} from "../models/match.models";
import {
  getActiveSeasonChampionshipIds,
  getSeasonChampionshipIds
} from "../models/season-league-external-id.models";
import { getReservationsWithEmailForMatch } from "../models/match-streams.models";
import { sendMatchScheduleChangeEmail } from "./email.services";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import { getMatch } from "../models/match.models";

const fetchFaceitChampionshipUpcomingMatches = async (
  championshipId: string
) => {
  const apiKey = process.env.FACEIT_API_KEY;

  if (!apiKey) {
    throw new Error("FACEIT_API_KEY environment variable is required");
  }

  const response = await fetch(
    `https://open.faceit.com/data/v4/championships/${championshipId}/matches?type=upcoming&limit=100`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `FACEIT API error for championship ${championshipId}: ${response.status} ${response.statusText}`
    );
  }

  const data: FaceitMatchesResponse = await response.json();

  return data.items;
};

const getMatchTeamNames = async (matchId: number): Promise<string> => {
  const teams = await runQuery<Array<{ name: string }>>(
    `SELECT t.name
     FROM Teams t
     JOIN MatchTeams mt ON t.id = mt.team_id
     WHERE mt.match_id = ?
     ORDER BY t.name`,
    [matchId]
  );

  if (teams.length === 0) {
    return "Unknown Teams";
  }

  if (teams.length === 1) {
    return teams[0].name;
  }

  return `${teams[0].name} vs ${teams[1].name}`;
};

/**
 * Notifies casters with reservations when a match schedule changes.
 * @param matchId - The match ID
 * @param oldTimestamp - ISO 8601 timestamp string (UTC) for the old schedule
 * @param newTimestamp - ISO 8601 timestamp string (UTC) for the new schedule
 */
const notifyReservationsOfScheduleChange = async (
  matchId: number,
  oldTimestamp: string,
  newTimestamp: string
): Promise<void> => {
  try {
    const reservations = await getReservationsWithEmailForMatch(matchId);

    if (reservations.length === 0) {
      logger.debug(`No reservations found for match ${matchId}`);
      return;
    }

    const teamNames = await getMatchTeamNames(matchId);
    const [matchRow] = await getMatch(matchId);
    const matchPageUrl = `${process.env.FRONTEND_URL}/matches/${matchId}`;
    const matchroomUrl = matchRow?.external_match_room_id
      ? `https://www.faceit.com/en/cs2/room/${matchRow.external_match_room_id}`
      : null;

    for (const reservation of reservations) {
      if (!reservation.work_email) {
        logger.warn(
          `No email found for reservation ${reservation.id}, skipping notification`
        );
        continue;
      }

      try {
        await sendMatchScheduleChangeEmail(reservation.work_email, {
          teamNames,
          oldTimestamp,
          newTimestamp,
          reservationHash: reservation.hash,
          matchPageUrl,
          matchroomUrl
        });

        logger.info(
          `Sent schedule change notification to ${reservation.work_email} for match ${matchId}`
        );
      } catch (emailError) {
        logger.error(
          `Failed to send schedule change email to ${reservation.work_email}:`,
          emailError
        );
      }
    }
  } catch (error) {
    logger.error(`Error notifying reservations for match ${matchId}:`, error);
  }
};

const syncMatchSchedule = async (
  faceitMatch: FaceitMatch,
  is_round_robin_bo2_as_2xbo1: boolean
): Promise<void> => {
  const notifyOfMatches: {
    matchId: number;
    oldTimestamp: string;
    newTimestamp: string;
  }[] = [];
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const databaseMatches = await getMatchesByExternalId(
      faceitMatch.match_id,
      connection
    );

    if (databaseMatches.length === 0) {
      logger.warn(
        `No database matches found for external_match_room_id: ${faceitMatch.match_id}`
      );
      return;
    }

    // FACEIT timestamps are Unix seconds since epoch (UTC)
    const faceitScheduleTimestamp = getFaceitMatchDateTime(
      faceitMatch.scheduled_at
    );

    const firstMatch = databaseMatches[0];
    const firstMatchTimestamp = new Date(
      firstMatch.start_timestamp
    ).toISOString();

    if (is_round_robin_bo2_as_2xbo1 && databaseMatches.length === 2) {
      const secondMatch = databaseMatches[1];
      const secondMatchTimestamp = new Date(
        secondMatch.start_timestamp
      ).toISOString();

      const faceitSecondAssumedScheduledTimestamp = adjustMatchDateTime(
        faceitScheduleTimestamp,
        { hours: 1 }
      );

      const isForfeitInDb =
        firstMatch.status === MatchStatus.FORFEIT ||
        secondMatch.status === MatchStatus.FORFEIT;

      if (
        firstMatchTimestamp === faceitScheduleTimestamp &&
        secondMatchTimestamp === faceitSecondAssumedScheduledTimestamp &&
        !isForfeitInDb
      ) {
        return;
      }

      logger.info(
        `[FACEIT] New time for match ${faceitMatch.match_id}: new ${faceitScheduleTimestamp} or ${faceitSecondAssumedScheduledTimestamp} vs. old ${firstMatchTimestamp} or ${secondMatchTimestamp} (2xBO1 as BO2)`
      );

      await updateMatchStartAndEndTimestamp(
        databaseMatches[0].id,
        faceitScheduleTimestamp,
        null,
        connection
      );

      await updateMatchStatusByMatchId(
        databaseMatches[0].id,
        "SCHEDULED",
        connection
      );

      notifyOfMatches.push({
        matchId: databaseMatches[0].id,
        oldTimestamp: firstMatchTimestamp,
        newTimestamp: faceitScheduleTimestamp
      });

      const secondMatchScheduleTimestamp = adjustMatchDateTime(
        faceitScheduleTimestamp,
        { hours: 1 }
      );

      await updateMatchStartAndEndTimestamp(
        databaseMatches[1].id,
        secondMatchScheduleTimestamp,
        null,
        connection
      );

      await updateMatchStatusByMatchId(
        databaseMatches[1].id,
        "SCHEDULED",
        connection
      );

      notifyOfMatches.push({
        matchId: databaseMatches[1].id,
        oldTimestamp: secondMatchTimestamp,
        newTimestamp: secondMatchScheduleTimestamp
      });

      logger.info(
        `Updated BO2 match schedules: First match at ${faceitScheduleTimestamp}, Second match at ${secondMatchScheduleTimestamp}`
      );
    } else {
      if (firstMatchTimestamp === faceitScheduleTimestamp) {
        return;
      }

      logger.info(
        `[FACEIT] New time for match ${faceitMatch.match_id}: new ${faceitScheduleTimestamp} vs. old ${firstMatchTimestamp}`
      );

      await updateMatchStartAndEndTimestamp(
        databaseMatches[0].id,
        faceitScheduleTimestamp,
        null,
        connection
      );

      await updateMatchStatusByMatchId(
        databaseMatches[0].id,
        "SCHEDULED",
        connection
      );

      notifyOfMatches.push({
        matchId: databaseMatches[0].id,
        oldTimestamp: firstMatchTimestamp,
        newTimestamp: faceitScheduleTimestamp
      });

      logger.info(
        `Updated single match ${databaseMatches[0].id} schedule: ${faceitScheduleTimestamp}`
      );
    }
    await connection.commit();
  } catch (error) {
    logger.error(`Error syncing match ${faceitMatch.match_id}:`, error);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    notifyOfMatches.forEach((match) => {
      if (match.oldTimestamp === match.newTimestamp) {
        return;
      }
      logger.info(
        `Notifying reservations of schedule change for match ${match.matchId}: ${match.oldTimestamp} -> ${match.newTimestamp}`
      );
      void notifyReservationsOfScheduleChange(
        match.matchId,
        match.oldTimestamp,
        match.newTimestamp
      );
    });
  }
};

export const syncFaceitChampionshipMatches = async (
  season_id?: number
): Promise<void> => {
  logger.info("Starting FACEIT championship match sync...");

  const championshipIds = season_id
    ? await getSeasonChampionshipIds(season_id)
    : await getActiveSeasonChampionshipIds();
  logger.info(
    `Found ${championshipIds.length} active season championships to sync`
  );

  if (championshipIds.length === 0) {
    logger.info("No active season championships found. Sync completed.");
    return;
  }

  for (const championship of championshipIds) {
    logger.info(`Syncing championship: ${championship.external_id}`);

    const faceitMatches = await fetchFaceitChampionshipUpcomingMatches(
      championship.external_id
    );
    logger.info(
      `Found ${faceitMatches.length} upcoming matches in FACEIT for championship ${championship.external_id}`
    );

    for (const faceitMatch of faceitMatches) {
      try {
        await syncMatchSchedule(
          faceitMatch,
          championship.is_round_robin_bo2_as_2xbo1
        );
      } catch (error) {
        logger.error(`Error syncing match ${faceitMatch.match_id}:`, error);
      }
    }
  }

  logger.info(`FACEIT championship match sync completed.`);
};
