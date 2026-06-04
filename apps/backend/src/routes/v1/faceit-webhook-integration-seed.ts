/**
 * Seed data for FACEIT webhook integration tests (3 external_match_room_ids).
 * Creates Organizers, Games, OrganizerGames, Seasons, Leagues, Stages,
 * SeasonLeagues, SeasonLeagueExternalIds, Teams, SeasonLeagueTeams from fixture-derived IDs.
 * Uses conflict handling so re-runs do not fail (ON DUPLICATE KEY UPDATE / select-then-insert).
 */

import * as fs from "fs";
import * as path from "path";
import { runQuery } from "../../db/mysqlRunQuery";
import { type ResultSetHeader } from "mysql2/promise";
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

/** Synthetic 2xBO1 rooms for forfeit-tuple integration tests. */
const FORFEIT_ROOM_IDS = [
  "1-00000003-0003-4000-8000-000000000003",
  "1-00000004-0004-4000-8000-000000000004",
  "1-00000005-0005-4000-8000-000000000005"
] as const;

/** Normal / BO3 single-Match rooms (one Match row per room, league has is_round_robin_bo2_as_2xbo1 = 0). */
const NORMAL_ROOM_IDS = [
  "1-00000001-0001-4000-8000-000000000001",
  "1-00000002-0002-4000-8000-000000000002"
] as const;

const ORGANIZER_FACEIT_ID = "d2372a88-623d-4ca3-9248-a480b6dfbe1a";
const ENTITY_IDS = [
  "7464ba95-996a-43bc-88c2-ccce3d6127ec",
  "32ea3ab1-d916-4701-b545-5c76b19d9c64"
] as const;

/** Forfeit-tuple rooms all live under this single entity (one league). */
const FORFEIT_ENTITY_ID = "f2f2f2f2-f0ff-4000-8000-000000000001";

const NORMAL_ENTITY_ID = "a1b2c3d4-e5f6-4078-8000-000000000001";
const CS2_APP_ID = 730;

interface FactionInfo {
  faction_id: string;
  name: string;
}

function loadFactionIdsFromFixtures(
  roomIds: readonly string[]
): Map<string, FactionInfo[]> {
  const byRoom = new Map<string, FactionInfo[]>();
  for (const roomId of roomIds) {
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

    // Step 0: clean up Matches/MatchGames/MatchTeams/FaceitWebhooks from prior
    // runs so standings queries don't accumulate across test reruns.
    const allRoomIds = [
      ...ROOM_IDS,
      ...FORFEIT_ROOM_IDS,
      ...NORMAL_ROOM_IDS
    ] as string[];
    const placeholders = allRoomIds.map(() => "?").join(", ");
    await runQuery(
      `DELETE mg FROM MatchGames mg
       INNER JOIN Matches m ON mg.match_id = m.id
       WHERE m.external_match_room_id IN (${placeholders})`,
      allRoomIds,
      trx
    );
    await runQuery(
      `DELETE mt FROM MatchTeams mt
       INNER JOIN Matches m ON mt.match_id = m.id
       WHERE m.external_match_room_id IN (${placeholders})`,
      allRoomIds,
      trx
    );
    await runQuery(
      `DELETE FROM Matches WHERE external_match_room_id IN (${placeholders})`,
      allRoomIds,
      trx
    );
    await runQuery(
      `DELETE FROM FaceitWebhooks WHERE external_payload_id IN (${placeholders})`,
      allRoomIds,
      trx
    );

    const byRoom2xBO1 = loadFactionIdsFromFixtures(ROOM_IDS);
    const byRoomNormal = loadFactionIdsFromFixtures(NORMAL_ROOM_IDS);
    const byRoomForfeit = loadFactionIdsFromFixtures(FORFEIT_ROOM_IDS);
    const allFactions = new Map<string, string>();
    for (const [, pairs] of byRoom2xBO1) {
      for (const { faction_id, name } of pairs) {
        if (!allFactions.has(faction_id)) allFactions.set(faction_id, name);
      }
    }
    const forfeitFactionIds = new Set<string>();
    for (const [, pairs] of byRoomForfeit) {
      for (const { faction_id, name } of pairs) {
        if (!allFactions.has(faction_id)) allFactions.set(faction_id, name);
        forfeitFactionIds.add(faction_id);
      }
    }
    const normalFactionIds = new Set<string>();
    for (const [, pairs] of byRoomNormal) {
      for (const { faction_id, name } of pairs) {
        if (!allFactions.has(faction_id)) allFactions.set(faction_id, name);
        normalFactionIds.add(faction_id);
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
      const ins = await runQuery<ResultSetHeader>(
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
      const ins = await runQuery<ResultSetHeader>(
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

    // 5. Leagues — one per entity_id so each entity_id resolves to a
    // distinct league_id, mirroring production where every FACEIT
    // championship entity belongs to its own Leagues row. Sharing a single
    // league_id across entities would let the standings query's
    // (season_id, league_id, stage_id, manual_group) JOIN pull matches from
    // *every* room in the seed regardless of `slei.external_id`, which
    // muddies the per-league anti-double-count assertion.
    const leagueIdByEntity = new Map<string, number>();
    for (const entityId of ENTITY_IDS) {
      const leagueName = `FACEIT Integration League ${entityId}`;
      const [existing] = await runQuery<Array<{ id: number }>>(
        "SELECT id FROM Leagues WHERE name = ? LIMIT 1",
        [leagueName],
        trx
      );
      let lid: number;
      if (existing?.id != null) {
        lid = existing.id;
      } else {
        const ins = await runQuery<ResultSetHeader>(
          "INSERT INTO Leagues (name, sort_priority) VALUES (?, ?)",
          [leagueName, 99],
          trx
        );
        lid = ins.insertId as number;
      }
      leagueIdByEntity.set(entityId, lid);
    }

    // 6. Stages
    const [stageRow] = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Stages WHERE name = ? LIMIT 1",
      ["FACEIT Integration Stage"],
      trx
    );
    const stageId =
      stageRow?.id ??
      (
        await runQuery<ResultSetHeader>(
          "INSERT INTO Stages (name) VALUES (?)",
          ["FACEIT Integration Stage"],
          trx
        )
      ).insertId;

    // 7. SeasonLeagues (PK season_id, league_id) — one row per entity-league.
    for (const lid of leagueIdByEntity.values()) {
      await runQuery(
        `INSERT IGNORE INTO SeasonLeagues (season_id, league_id, tier) VALUES (?, ?, ?)`,
        [seasonId, lid, 1],
        trx
      );
    }

    // 8. SeasonLeagueExternalIds (unique season_id, league_id, external_id).
    // `manual_group = 1` matches the `group: 1` value baked into all 2xBO1
    // fixture webhook payloads. Without it the standings query's
    //   AND (m.group = slei.manual_group OR (m.group IS NULL AND
    //        slei.manual_group IS NULL))
    // join clause excludes every replayed match (since `Matches.group = 1`
    // but `SeasonLeagueExternalIds.manual_group = NULL`), and
    // `getDivStandings` returns an empty array for the league.
    //
    // Delete any SLEI rows that point our test entity IDs at OTHER seasons
    // (e.g. the real production season 16/17 rows on the dev DB). If left in
    // place, `getSeasonLeagueExternalIdByExternalIdWithSeasonSettings` picks
    // those lower-id rows and routes webhook-replayed Matches into the real
    // season, causing `getDivStandings` to aggregate hundreds of production
    // matches and fail the games_played assertions.
    const allTestEntityIds = [
      ...ENTITY_IDS,
      FORFEIT_ENTITY_ID,
      NORMAL_ENTITY_ID
    ];
    const sleiPlaceholders = allTestEntityIds.map(() => "?").join(", ");
    await runQuery(
      `DELETE FROM SeasonLeagueExternalIds WHERE external_id IN (${sleiPlaceholders})`,
      allTestEntityIds,
      trx
    );
    for (const entityId of ENTITY_IDS) {
      const lid = leagueIdByEntity.get(entityId);
      if (lid == null) throw new Error(`No league_id for entity ${entityId}`);
      await runQuery(
        `INSERT INTO SeasonLeagueExternalIds (external_id, external_league_name, season_id, league_id, stage_id, type, manual_group)
         VALUES (?, ?, ?, ?, ?, 'roundRobin', ?)
         ON DUPLICATE KEY UPDATE manual_group = VALUES(manual_group), updated_at = CURRENT_TIMESTAMP`,
        [entityId, "FACEIT Integration League", seasonId, lid, stageId, 1],
        trx
      );
    }

    // 9. Teams (unique on name) and SeasonLeagueTeams (one row per
    // (season, team, league) — register every team in *every* per-entity
    // league since fixture-derived faction ids do not preserve which entity
    // they originally belonged to. A team that never plays in a given
    // league simply has no Matches there, so duplicate registrations are
    // harmless for standings.
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
      for (const lid of leagueIdByEntity.values()) {
        await runQuery(
          `INSERT IGNORE INTO SeasonLeagueTeams (season_id, team_id, league_id, external_team_id) VALUES (?, ?, ?, ?)`,
          [seasonId, teamId, lid, factionId],
          trx
        );
      }
    }

    // 10. Forfeit league — one entity, same 2xBO1 season, manual_group = 1.
    // Rooms 1-00000003…, 1-00000004…, 1-00000005… use this entity to exercise
    // (FORFEIT,FINISHED), (FINISHED,FORFEIT), and (FORFEIT,FORFEIT) tuples.
    const forfeitLeagueName = `FACEIT Integration Forfeit League ${FORFEIT_ENTITY_ID}`;
    const [forfeitLeagueRow] = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Leagues WHERE name = ? LIMIT 1",
      [forfeitLeagueName],
      trx
    );
    const forfeitLeagueId =
      forfeitLeagueRow?.id ??
      (
        await runQuery<ResultSetHeader>(
          "INSERT INTO Leagues (name, sort_priority) VALUES (?, ?)",
          [forfeitLeagueName, 97],
          trx
        )
      ).insertId;

    await runQuery(
      `INSERT IGNORE INTO SeasonLeagues (season_id, league_id, tier) VALUES (?, ?, ?)`,
      [seasonId, forfeitLeagueId, 1],
      trx
    );
    await runQuery(
      `INSERT INTO SeasonLeagueExternalIds (external_id, external_league_name, season_id, league_id, stage_id, type, manual_group)
       VALUES (?, ?, ?, ?, ?, 'roundRobin', ?)
       ON DUPLICATE KEY UPDATE manual_group = VALUES(manual_group), updated_at = CURRENT_TIMESTAMP`,
      [
        FORFEIT_ENTITY_ID,
        "Forfeit League",
        seasonId,
        forfeitLeagueId,
        stageId,
        1
      ],
      trx
    );
    for (const factionId of forfeitFactionIds) {
      const safeName = `faceit-fixture-${factionId}`.slice(0, 255);
      const [tRow] = await runQuery<Array<{ id: number }>>(
        "SELECT id FROM Teams WHERE name = ? LIMIT 1",
        [safeName],
        trx
      );
      const teamId = tRow?.id;
      if (teamId == null) throw new Error(`Team not found: ${safeName}`);
      await runQuery(
        `INSERT IGNORE INTO SeasonLeagueTeams (season_id, team_id, league_id, external_team_id) VALUES (?, ?, ?, ?)`,
        [seasonId, teamId, forfeitLeagueId, factionId],
        trx
      );
    }

    // 11. Normal league (single Match per room: BO1 or BO3, is_round_robin_bo2_as_2xbo1 = 0)
    const [normalSeasonRow] = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Seasons WHERE organizer_id = ? AND platform = 'faceit' AND is_round_robin_bo2_as_2xbo1 = 0 LIMIT 1",
      [organizerId],
      trx
    );
    let normalSeasonId: number;
    if (normalSeasonRow?.id != null) {
      normalSeasonId = normalSeasonRow.id;
    } else {
      const ins = await runQuery<ResultSetHeader>(
        `INSERT INTO Seasons (game_id, organizer_id, name, full_name, start_date, platform, is_round_robin_bo2_as_2xbo1)
         VALUES (?, ?, ?, ?, ?, 'faceit', 0)`,
        [
          gameId,
          organizerId,
          "FACEIT Integration Normal Season",
          "FACEIT Integration Normal Season",
          "2025-01-01"
        ],
        trx
      );
      normalSeasonId = ins.insertId as number;
    }

    const [normalLeagueRow] = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Leagues WHERE name = ? LIMIT 1",
      ["FACEIT Integration Normal League"],
      trx
    );
    const normalLeagueId =
      normalLeagueRow?.id ??
      (
        await runQuery<ResultSetHeader>(
          "INSERT INTO Leagues (name, sort_priority) VALUES (?, ?)",
          ["FACEIT Integration Normal League", 98],
          trx
        )
      ).insertId;

    await runQuery(
      `INSERT IGNORE INTO SeasonLeagues (season_id, league_id, tier) VALUES (?, ?, ?)`,
      [normalSeasonId, normalLeagueId, 1],
      trx
    );

    await runQuery(
      `INSERT INTO SeasonLeagueExternalIds (external_id, external_league_name, season_id, league_id, stage_id, type)
       VALUES (?, ?, ?, ?, ?, 'roundRobin')
       ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
      [
        NORMAL_ENTITY_ID,
        "Normal League",
        normalSeasonId,
        normalLeagueId,
        stageId
      ],
      trx
    );

    for (const factionId of normalFactionIds) {
      const safeName = `faceit-fixture-${factionId}`.slice(0, 255);
      const [tRow] = await runQuery<Array<{ id: number }>>(
        "SELECT id FROM Teams WHERE name = ? LIMIT 1",
        [safeName],
        trx
      );
      const teamId = tRow?.id;
      if (teamId == null) throw new Error(`Team not found: ${safeName}`);
      await runQuery(
        `INSERT IGNORE INTO SeasonLeagueTeams (season_id, team_id, league_id, external_team_id) VALUES (?, ?, ?, ?)`,
        [normalSeasonId, teamId, normalLeagueId, factionId],
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
