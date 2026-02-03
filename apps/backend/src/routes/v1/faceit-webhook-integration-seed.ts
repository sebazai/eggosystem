/**
 * Seed data for FACEIT webhook integration tests (3 external_match_room_ids).
 * Creates Organizers, Games, OrganizerGames, Seasons, Leagues, Stages,
 * SeasonLeagues, SeasonLeagueExternalIds, Teams, SeasonLeagueTeams from fixture-derived IDs.
 * Uses conflict handling so re-runs do not fail (ON DUPLICATE KEY UPDATE / select-then-insert).
 */

import * as fs from "fs";
import * as path from "path";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";

function getFixturesDir(): string {
  const fromDir = path.join(__dirname, "fixtures", "faceit-webhooks");
  if (fs.existsSync(fromDir)) return fromDir;
  const fromCwd = path.join(
    process.cwd(),
    "src",
    "routes",
    "v1",
    "fixtures",
    "faceit-webhooks"
  );
  if (fs.existsSync(fromCwd)) return fromCwd;
  return fromDir;
}
const FIXTURES_DIR = getFixturesDir();
const ROOM_IDS = [
  "1-3e047cf2-6b8f-479b-8a47-7ca122a2116d",
  "1-d3b5d80b-4319-4eaa-a34c-4fc4d17a8d5f",
  "1-f55c14a9-b708-4abc-8ffb-be4993e469c1"
] as const;

const ORGANIZER_FACEIT_ID = "d2372a88-623d-4ca3-9248-a480b6dfbe1a";
const ENTITY_IDS = [
  "7464ba95-996a-43bc-88c2-ccce3d6127ec",
  "32ea3ab1-d916-4701-b545-5c76b19d9c64"
] as const;
const CS2_APP_ID = 730;

interface FactionInfo {
  faction_id: string;
  name: string;
}

function loadFactionIdsFromFixtures(): Map<string, FactionInfo[]> {
  const byRoom = new Map<string, FactionInfo[]>();
  for (const roomId of ROOM_IDS) {
    const p = path.join(FIXTURES_DIR, `${roomId}.json`);
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, "utf8");
    const rows: Array<{
      event: string;
      details?: {
        teams?: {
          faction1?: { faction_id: string; name: string };
          faction2?: { faction_id: string; name: string };
        };
      };
    }> = JSON.parse(raw);
    const firstCreated = rows.find((r) => r.event === "match_object_created");
    if (
      !firstCreated?.details?.teams?.faction1 ||
      !firstCreated?.details?.teams?.faction2
    )
      continue;
    const f1 = firstCreated.details.teams.faction1;
    const f2 = firstCreated.details.teams.faction2;
    byRoom.set(roomId, [
      { faction_id: f1.faction_id, name: f1.name ?? `Team-${f1.faction_id}` },
      { faction_id: f2.faction_id, name: f2.name ?? `Team-${f2.faction_id}` }
    ]);
  }
  return byRoom;
}

export async function runFaceitWebhookIntegrationSeed(): Promise<void> {
  const connection = await getConnection();
  const trx = connection;
  try {
    await trx.beginTransaction();

    const byRoom = loadFactionIdsFromFixtures();
    const allFactions = new Map<string, string>();
    for (const [, pairs] of byRoom) {
      for (const { faction_id, name } of pairs) {
        if (!allFactions.has(faction_id)) allFactions.set(faction_id, name);
      }
    }

    // 1. Organizers (unique on faceit_id)
    await trx.execute(
      `INSERT INTO Organizers (name, faceit_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
      ["FACEIT Integration Test Organizer", ORGANIZER_FACEIT_ID]
    );
    const [organizerRow] = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Organizers WHERE faceit_id = ?",
      [ORGANIZER_FACEIT_ID],
      trx
    );
    const organizerId = organizerRow?.id;
    if (organizerId == null)
      throw new Error("Organizer not found after insert");

    // 2. Games (by app_id; may already exist)
    let gameId: number;
    const [gameRow] = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Games WHERE app_id = ?",
      [CS2_APP_ID],
      trx
    );
    if (gameRow?.id != null) {
      gameId = gameRow.id;
    } else {
      const ins = await runQuery<{ insertId: number }>(
        "INSERT INTO Games (name, abbreviation, app_id) VALUES (?, ?, ?)",
        ["CS2", "CS2", CS2_APP_ID],
        trx
      );
      gameId = ins.insertId as number;
    }

    // 3. OrganizerGames (ignore duplicate)
    await runQuery(
      `INSERT IGNORE INTO OrganizerGames (organizer_id, game_id) VALUES (?, ?)`,
      [organizerId, gameId],
      trx
    );

    // 4. Seasons (one season for faceit, is_round_robin_bo2_as_2xbo1 = 1)
    const [seasonRow] = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Seasons WHERE organizer_id = ? AND platform = 'faceit' LIMIT 1",
      [organizerId],
      trx
    );
    let seasonId: number;
    if (seasonRow?.id != null) {
      seasonId = seasonRow.id;
      await runQuery(
        "UPDATE Seasons SET is_round_robin_bo2_as_2xbo1 = 1 WHERE id = ?",
        [seasonId],
        trx
      );
    } else {
      const ins = await runQuery<{ insertId: number }>(
        `INSERT INTO Seasons (game_id, organizer_id, name, full_name, start_date, platform, is_round_robin_bo2_as_2xbo1)
         VALUES (?, ?, ?, ?, ?, 'faceit', 1)`,
        [
          gameId,
          organizerId,
          "FACEIT Integration Season",
          "FACEIT Integration Season",
          "2025-01-01"
        ],
        trx
      );
      seasonId = ins.insertId as number;
    }

    // 5. Leagues
    const [leagueRow] = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Leagues WHERE name = ? LIMIT 1",
      ["FACEIT Integration League"],
      trx
    );
    const leagueId =
      leagueRow?.id ??
      ((
        (await runQuery<{ insertId: number }>(
          "INSERT INTO Leagues (name, sort_priority) VALUES (?, ?)",
          ["FACEIT Integration League", 99],
          trx
        )) as { insertId: number }
      ).insertId as number);

    // 6. Stages
    const [stageRow] = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Stages WHERE name = ? LIMIT 1",
      ["FACEIT Integration Stage"],
      trx
    );
    const stageId =
      stageRow?.id ??
      ((
        (await runQuery<{ insertId: number }>(
          "INSERT INTO Stages (name) VALUES (?)",
          ["FACEIT Integration Stage"],
          trx
        )) as { insertId: number }
      ).insertId as number);

    // 7. SeasonLeagues (PK season_id, league_id)
    await runQuery(
      `INSERT IGNORE INTO SeasonLeagues (season_id, league_id, tier) VALUES (?, ?, ?)`,
      [seasonId, leagueId, 1],
      trx
    );

    // 8. SeasonLeagueExternalIds (unique season_id, league_id, external_id)
    for (const entityId of ENTITY_IDS) {
      await runQuery(
        `INSERT INTO SeasonLeagueExternalIds (external_id, external_league_name, season_id, league_id, stage_id, type)
         VALUES (?, ?, ?, ?, ?, 'roundRobin')
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
        [entityId, "FACEIT Integration League", seasonId, leagueId, stageId],
        trx
      );
    }

    // 9. Teams (unique on name) and SeasonLeagueTeams
    for (const [factionId, _teamName] of allFactions) {
      const safeName = `faceit-fixture-${factionId}`.slice(0, 255);
      await runQuery(
        `INSERT INTO Teams (name, team_logo) VALUES (?, 'nologo.png')
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
        [safeName],
        trx
      );
      const [tRow] = await runQuery<Array<{ id: number }>>(
        "SELECT id FROM Teams WHERE name = ? LIMIT 1",
        [safeName],
        trx
      );
      const teamId = tRow?.id;
      if (teamId == null) throw new Error(`Team not found: ${safeName}`);
      await runQuery(
        `INSERT IGNORE INTO SeasonLeagueTeams (season_id, team_id, league_id, external_team_id) VALUES (?, ?, ?, ?)`,
        [seasonId, teamId, leagueId, factionId],
        trx
      );
    }

    await trx.commit();
  } catch (err) {
    await trx.rollback();
    throw err;
  } finally {
    trx.release();
  }
}
