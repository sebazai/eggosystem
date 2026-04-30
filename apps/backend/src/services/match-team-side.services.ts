import type { FaceitMatchTeams } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { logger } from "../utils/app-logger";
import { getSeasonLeagueTeamByExternalId } from "../models/season-league-team.models";
import type { PoolConnection } from "mysql2/promise";

function hasDistinctFaceitFactionTeams(details: unknown): details is {
  teams: FaceitMatchTeams;
} {
  if (!details || typeof details !== "object" || !("teams" in details)) {
    return false;
  }
  const teams = (details as { teams: unknown }).teams;
  if (!teams || typeof teams !== "object") return false;
  if (!("faction1" in teams) || !("faction2" in teams)) return false;
  const f1 = (teams as FaceitMatchTeams).faction1?.faction_id;
  const f2 = (teams as FaceitMatchTeams).faction2?.faction_id;
  return (
    typeof f1 === "string" &&
    typeof f2 === "string" &&
    f1 !== "" &&
    f2 !== "" &&
    f1 !== f2
  );
}

/** Persists faction1→home and faction2→away for every MatchTeams row tied to `external_room_id`. */
async function syncMatchTeamSidesFromFaceitTeams(
  externalRoomId: string,
  teams: FaceitMatchTeams,
  connection?: PoolConnection
): Promise<void> {
  await syncMatchTeamSidesFromFactionIds(
    externalRoomId,
    teams.faction1.faction_id,
    teams.faction2.faction_id,
    connection
  );
}

export async function syncMatchTeamSidesFromMatchDetailsPayload(
  externalRoomId: string,
  details: unknown,
  connection?: PoolConnection
): Promise<void> {
  if (!hasDistinctFaceitFactionTeams(details)) return;
  await syncMatchTeamSidesFromFaceitTeams(
    externalRoomId,
    details.teams,
    connection
  );
}

async function syncMatchTeamSidesFromFactionIds(
  externalRoomId: string,
  faction1ExternalId: string,
  faction2ExternalId: string,
  connection?: PoolConnection
): Promise<void> {
  if (!faction1ExternalId || !faction2ExternalId) return;
  if (faction1ExternalId === faction2ExternalId) return;

  const seasonRows = await runQuery<Array<{ season_id: number }>>(
    `SELECT DISTINCT season_id FROM Matches WHERE external_match_room_id = ?`,
    [externalRoomId],
    connection
  );
  if (seasonRows.length !== 1) {
    if (seasonRows.length > 1) {
      logger.warn(
        `[match_side] Multiple seasons for room ${externalRoomId}; skip sync`
      );
    }
    return;
  }
  const seasonId = seasonRows[0]!.season_id;

  const team1 = await getSeasonLeagueTeamByExternalId(
    faction1ExternalId,
    seasonId,
    connection
  );
  const team2 = await getSeasonLeagueTeamByExternalId(
    faction2ExternalId,
    seasonId,
    connection
  );
  if (!team1 || !team2 || team1.team_id === team2.team_id) return;

  await runQuery(
    `UPDATE MatchTeams mt
     INNER JOIN Matches m ON m.id = mt.match_id AND m.external_match_room_id = ?
     SET mt.match_side = CASE mt.team_id
       WHEN ? THEN 'home'
       WHEN ? THEN 'away'
     END
     WHERE mt.team_id IN (?, ?)`,
    [
      externalRoomId,
      team1.team_id,
      team2.team_id,
      team1.team_id,
      team2.team_id
    ],
    connection
  );
}
