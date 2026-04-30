import { runQuery } from "../db/mysqlRunQuery";
import { logger } from "../utils/app-logger";
import { getSeasonLeagueTeamByExternalId } from "../models/season-league-team.models";
import type { PoolConnection } from "mysql2/promise";

function readOwnString(source: object, key: string): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(source, key)) {
    return undefined;
  }
  const value = Reflect.get(source, key);
  return typeof value === "string" ? value : undefined;
}

function readFaceitFactionId(factionBlock: unknown): string | undefined {
  if (factionBlock === null || typeof factionBlock !== "object") {
    return undefined;
  }
  return readOwnString(factionBlock, "faction_id");
}

/** Parses match details payload for two distinct non-empty Faceit faction ids. */
function extractDistinctFactionPair(details: unknown): {
  faction1Id: string;
  faction2Id: string;
} | null {
  if (details === null || typeof details !== "object") {
    return null;
  }
  if (!Object.prototype.hasOwnProperty.call(details, "teams")) {
    return null;
  }
  const teams = Reflect.get(details, "teams");
  if (teams === null || typeof teams !== "object") {
    return null;
  }
  if (!("faction1" in teams) || !("faction2" in teams)) {
    return null;
  }
  const f1 = readFaceitFactionId(Reflect.get(teams, "faction1"));
  const f2 = readFaceitFactionId(Reflect.get(teams, "faction2"));
  if (
    f1 === undefined ||
    f2 === undefined ||
    f1 === "" ||
    f2 === "" ||
    f1 === f2
  ) {
    return null;
  }
  return { faction1Id: f1, faction2Id: f2 };
}

export async function syncMatchTeamSidesFromMatchDetailsPayload(
  externalRoomId: string,
  details: unknown,
  connection?: PoolConnection
): Promise<void> {
  const pair = extractDistinctFactionPair(details);
  if (!pair) return;
  await syncMatchTeamSidesFromFactionIds(
    externalRoomId,
    pair.faction1Id,
    pair.faction2Id,
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
