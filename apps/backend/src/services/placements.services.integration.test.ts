/**
 * Integration tests: automatic SeasonLeagueTeams placement assignment when
 * the grand final (group=3, round=1) finishes via match_status_finished webhook.
 *
 * Uses synthetic IDs (9901+) to avoid collision with production data.
 * Stages row id=2 ("Playoff") is pre-seeded by migration 20250704141851.
 */

const TEST_WEBHOOK_API_KEY = "test-placements-webhook-key-9901";
process.env.FACEIT_WEBHOOK_API_KEY = TEST_WEBHOOK_API_KEY;

// jest.mock is hoisted before imports — mock the source module to avoid
// the non-configurable re-export issue with barrel files (export * from).
jest.mock("./faceit-match.services", () => ({
  ...jest.requireActual<typeof import("./faceit-match.services")>(
    "./faceit-match.services"
  ),
  getFaceITMatchDetails: jest.fn()
}));

import request from "supertest";
import express from "express";
import faceitRouter from "../routes/v1/faceit.routes";
import { expressErrorHandler } from "../middlewares/express-error-handler";
import { runQuery } from "../db/mysqlRunQuery";
import { type ResultSetHeader } from "mysql2/promise";
import { insertTestSeasonSignupSettings } from "../__utils__/season-signup-settings-test";
import * as faceitMatchModule from "./faceit-match.services";
import {
  assignGrandFinalPlacementsForFinishedMatch,
  assignGrandFinalPlacementsIfEligible
} from "./placements.services";
import { replayGrandFinalPlacements } from "./replay-grand-final-placements.services";
import { logger } from "../utils/app-logger";
import { type ChampionshipDetailsFinished } from "@eggosystem/types";

// Synthetic IDs — high enough not to collide with production data
const S_ID = 9901;
const L_ID = 9901;
const STAGE_ID = 2; // pre-seeded "Playoff" by migration 20250704141851
const CHAMP_EXT_ID = "test-playoff-champ-id-9901";
const GF_ROOM_ID = "test-grand-final-room-9901";
const LBF_ROOM_ID = "test-lb-final-room-9901";

// TEAM_A = 3rd (LB final loser), TEAM_B = 2nd (GF loser / LB final winner), TEAM_C = 1st (GF winner)
const TEAM_A = {
  id: 9901,
  extId: "test-faction-a-9901",
  name: "Test Team A 9901"
};
const TEAM_B = {
  id: 9902,
  extId: "test-faction-b-9902",
  name: "Test Team B 9902"
};
const TEAM_C = {
  id: 9903,
  extId: "test-faction-c-9903",
  name: "Test Team C 9903"
};

const app = express();
app.use(express.json());
app.use("/api/v1/faceit", faceitRouter);
app.use(expressErrorHandler);

async function cleanup(): Promise<void> {
  await runQuery(
    `DELETE mt FROM MatchTeams mt
     INNER JOIN Matches m ON m.id = mt.match_id
     WHERE m.season_id = ?`,
    [S_ID]
  );
  await runQuery(`DELETE FROM Matches WHERE season_id = ?`, [S_ID]);
  await runQuery(
    `DELETE FROM FaceitWebhooks WHERE external_payload_id IN (?, ?)`,
    [GF_ROOM_ID, LBF_ROOM_ID]
  );
  await runQuery(`DELETE FROM SeasonLeagueTeams WHERE season_id = ?`, [S_ID]);
  await runQuery(`DELETE FROM SeasonLeagueExternalIds WHERE season_id = ?`, [
    S_ID
  ]);
  await runQuery(`DELETE FROM SeasonLeagues WHERE season_id = ?`, [S_ID]);
  await runQuery(`DELETE FROM Seasons WHERE id = ?`, [S_ID]);
  await runQuery(`DELETE FROM Leagues WHERE id = ?`, [L_ID]);
  await runQuery(`DELETE FROM Teams WHERE id IN (?, ?, ?, ?)`, [
    TEAM_A.id,
    TEAM_B.id,
    TEAM_C.id,
    9904 // stale podium team inserted by the clear-stale-placements test
  ]);
}

async function seed(
  options: { includeLbFinal: boolean } = { includeLbFinal: true }
): Promise<void> {
  await runQuery(
    `INSERT INTO Seasons (id, game_id, organizer_id, name, full_name, start_date, platform)
     VALUES (?, 1, 1, 'Test Playoffs 9901', 'Test Playoffs 9901', '2026-01-01', 'faceit')`,
    [S_ID]
  );
  await runQuery(
    `INSERT INTO CSSeasonSettings (season_id, is_round_robin_bo2_as_2xbo1, grand_final_round_one_only) VALUES (?, 0, 1)`,
    [S_ID]
  );
  await insertTestSeasonSignupSettings(S_ID);
  await runQuery(
    `INSERT INTO Leagues (id, name, sort_priority) VALUES (?, 'Test Playoff League 9901', 0)`,
    [L_ID]
  );
  for (const t of [TEAM_A, TEAM_B, TEAM_C]) {
    await runQuery(
      `INSERT INTO Teams (id, name, team_logo) VALUES (?, ?, 'nologo.png')`,
      [t.id, t.name]
    );
  }
  // SeasonLeagues is required by SeasonLeagueExternalIds FK constraint
  await runQuery(
    `INSERT INTO SeasonLeagues (season_id, league_id, tier) VALUES (?, ?, 1)`,
    [S_ID, L_ID]
  );
  await runQuery(
    `INSERT INTO SeasonLeagueExternalIds (external_id, external_league_name, season_id, league_id, stage_id, type, manual_group)
     VALUES (?, 'Test Playoffs 9901', ?, ?, ?, 'doubleElimination', NULL)`,
    [CHAMP_EXT_ID, S_ID, L_ID, STAGE_ID]
  );
  for (const t of [TEAM_A, TEAM_B, TEAM_C]) {
    await runQuery(
      `INSERT INTO SeasonLeagueTeams (season_id, league_id, team_id, external_team_id, placement)
       VALUES (?, ?, ?, ?, NULL)`,
      [S_ID, L_ID, t.id, t.extId]
    );
  }

  if (options.includeLbFinal) {
    // LB final: team A (future 3rd) vs team B (future 2nd, advances to GF)
    const lbf = await runQuery<ResultSetHeader>(
      `INSERT INTO Matches (league_id, season_id, stage, best_of, start_timestamp, end_timestamp, external_match_room_id, status, round, \`group\`)
       VALUES (?, ?, ?, 3, '2026-04-01 18:00:00', '2026-04-01 20:00:00', ?, 'FINISHED', 4, 2)`,
      [L_ID, S_ID, STAGE_ID, LBF_ROOM_ID]
    );
    await runQuery(
      `INSERT INTO MatchTeams (match_id, season_id, league_id, team_id, match_side)
       VALUES (?, ?, ?, ?, 'home'), (?, ?, ?, ?, 'away')`,
      [lbf.insertId, S_ID, L_ID, TEAM_A.id, lbf.insertId, S_ID, L_ID, TEAM_B.id]
    );
  }

  // Grand final: team C (faction1, winner) vs team B (faction2, loser)
  const gf = await runQuery<ResultSetHeader>(
    `INSERT INTO Matches (league_id, season_id, stage, best_of, start_timestamp, end_timestamp, external_match_room_id, status, round, \`group\`)
     VALUES (?, ?, ?, 3, '2026-04-08 18:00:00', NULL, ?, 'SCHEDULED', 1, 3)`,
    [L_ID, S_ID, STAGE_ID, GF_ROOM_ID]
  );
  await runQuery(
    `INSERT INTO MatchTeams (match_id, season_id, league_id, team_id, match_side)
     VALUES (?, ?, ?, ?, 'home'), (?, ?, ?, ?, 'away')`,
    [gf.insertId, S_ID, L_ID, TEAM_C.id, gf.insertId, S_ID, L_ID, TEAM_B.id]
  );
}

function makeMatchDetails(): ChampionshipDetailsFinished {
  return {
    match_id: GF_ROOM_ID,
    competition_type: "championship",
    group: 3,
    round: 1,
    best_of: 3,
    version: 1,
    game: "cs2",
    region: "EU",
    competition_id: CHAMP_EXT_ID,
    competition_name: "Test Playoffs 9901",
    organizer_id: "org-test",
    status: "FINISHED",
    calculate_elo: false,
    chat_room_id: "",
    faceit_url: "",
    demo_url: [],
    configured_at: 0,
    started_at: 0,
    finished_at: 0,
    voting: {
      map: { pick: [], entities: [] },
      voted_entity_types: [],
      location: { pick: [], entities: [] }
    },
    teams: {
      faction1: {
        faction_id: TEAM_C.extId,
        name: TEAM_C.name,
        leader: "",
        avatar: "",
        roster: [],
        substituted: false,
        type: "premade"
      },
      faction2: {
        faction_id: TEAM_B.extId,
        name: TEAM_B.name,
        leader: "",
        avatar: "",
        roster: [],
        substituted: false,
        type: "premade"
      }
    },
    // faction1 (team C) wins the grand final
    results: { winner: "faction1", score: { faction1: 2, faction2: 0 } },
    detailed_results: [
      {
        asc_score: false,
        winner: "faction1",
        factions: { faction1: { score: 16 }, faction2: { score: 4 } }
      }
    ]
  } as ChampionshipDetailsFinished;
}

// FaceIT CS2 game UUID — maps to app_id=730 via convertFaceitGameToAppId
const FACEIT_CS2_GAME_ID = "6d9298b7-73e4-4672-96b5-720293ba2a4a";
// Kanaliiga organizer FaceIT ID (id=1 in Organizers table)
const KANALIIGA_FACEIT_ID = "d2372a88-623d-4ca3-9248-a480b6dfbe1a";

function makeWebhookBody(txId: string) {
  const now = new Date().toISOString();
  return {
    transaction_id: txId,
    event: "match_status_finished",
    event_id: `evt-${txId}`,
    third_party_id: "",
    app_id: FACEIT_CS2_GAME_ID,
    timestamp: now,
    retry_count: 0,
    version: 1,
    payload: {
      id: GF_ROOM_ID,
      organizer_id: KANALIIGA_FACEIT_ID,
      region: "EU",
      game: "cs2",
      version: 1,
      entity: {
        id: CHAMP_EXT_ID,
        type: "championship",
        name: "Test Playoffs 9901"
      },
      teams: [],
      created_at: now,
      updated_at: now,
      started_at: now,
      finished_at: now
    }
  };
}

async function postWebhook(txId: string) {
  return request(app)
    .post("/api/v1/faceit/webhook")
    .set("X-API-KEY", TEST_WEBHOOK_API_KEY)
    .send(makeWebhookBody(txId));
}

async function getPlacements(): Promise<Record<number, number | null>> {
  const rows = await runQuery<
    Array<{ team_id: number; placement: number | null }>
  >(
    `SELECT team_id, placement FROM SeasonLeagueTeams WHERE season_id = ? ORDER BY team_id`,
    [S_ID]
  );
  return Object.fromEntries(rows.map((r) => [r.team_id, r.placement]));
}

describe("placements.services — grand final placement assignment", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanup();
    await seed();
    (faceitMatchModule.getFaceITMatchDetails as jest.Mock).mockResolvedValue(
      makeMatchDetails()
    );
  });

  afterEach(async () => {
    await cleanup();
  });

  it("sets placement 1/2/3 when grand final finishes", async () => {
    const res = await postWebhook("txn-gf-test-1");
    expect(res.status).toBe(200);

    const placements = await getPlacements();
    expect(placements[TEAM_C.id]).toBe(1); // GF winner
    expect(placements[TEAM_B.id]).toBe(2); // GF loser
    expect(placements[TEAM_A.id]).toBe(3); // LB final loser
  });

  it("is idempotent — re-triggering the webhook keeps the same placements", async () => {
    await postWebhook("txn-gf-idempotent-1");
    const res = await postWebhook("txn-gf-idempotent-2");
    expect(res.status).toBe(200);

    const placements = await getPlacements();
    expect(placements[TEAM_C.id]).toBe(1);
    expect(placements[TEAM_B.id]).toBe(2);
    expect(placements[TEAM_A.id]).toBe(3);
  });

  it("skips 3rd place gracefully when no LB final match exists", async () => {
    await cleanup();
    await seed({ includeLbFinal: false });
    (faceitMatchModule.getFaceITMatchDetails as jest.Mock).mockResolvedValue(
      makeMatchDetails()
    );

    const res = await postWebhook("txn-gf-no-lb-1");
    expect(res.status).toBe(200);

    const placements = await getPlacements();
    expect(placements[TEAM_C.id]).toBe(1);
    expect(placements[TEAM_B.id]).toBe(2);
    expect(placements[TEAM_A.id]).toBeNull(); // no LB final — 3rd place not set
  });

  it("assignGrandFinalPlacementsForFinishedMatch sets 1/2/3 for a finished GF match row", async () => {
    const gfRows = await runQuery<Array<{ id: number }>>(
      `SELECT id FROM Matches WHERE season_id = ? AND \`group\` = 3 AND round = 1`,
      [S_ID]
    );
    const gfMatch = gfRows[0];
    expect(gfMatch).toBeDefined();

    const result = await assignGrandFinalPlacementsForFinishedMatch({
      id: gfMatch.id,
      group: 3,
      round: 1,
      external_match_room_id: GF_ROOM_ID,
      season_id: S_ID,
      league_id: L_ID,
      stage: STAGE_ID
    });

    expect(result.applied).toBe(true);
    expect(result.updated).toEqual(
      expect.arrayContaining([
        {
          team_id: TEAM_C.id,
          placement: 1,
          team_name: TEAM_C.name
        },
        {
          team_id: TEAM_B.id,
          placement: 2,
          team_name: TEAM_B.name
        },
        {
          team_id: TEAM_A.id,
          placement: 3,
          team_name: TEAM_A.name
        }
      ])
    );

    const placements = await getPlacements();
    expect(placements[TEAM_C.id]).toBe(1);
    expect(placements[TEAM_B.id]).toBe(2);
    expect(placements[TEAM_A.id]).toBe(3);
  });

  it("returns faceit_fetch_failed and logs a warning when FACEIT API throws", async () => {
    const warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => logger);
    (faceitMatchModule.getFaceITMatchDetails as jest.Mock).mockRejectedValue(
      new Error("network timeout")
    );

    const result = await assignGrandFinalPlacementsForFinishedMatch({
      id: 0,
      group: 3,
      round: 1,
      external_match_room_id: GF_ROOM_ID,
      season_id: S_ID,
      league_id: L_ID,
      stage: STAGE_ID
    });

    expect(result).toEqual({
      applied: false,
      skipped_reason: "faceit_fetch_failed",
      season_id: S_ID,
      league_id: L_ID,
      updated: []
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(GF_ROOM_ID),
      expect.any(Error)
    );
    warnSpy.mockRestore();

    const placements = await getPlacements();
    expect(placements[TEAM_C.id]).toBeNull();
    expect(placements[TEAM_B.id]).toBeNull();
    expect(placements[TEAM_A.id]).toBeNull();
  });

  it("clears stale podium placements before rewriting 1/2/3", async () => {
    const staleWinnerTeamId = 9904;
    await runQuery(
      `INSERT INTO Teams (id, name, team_logo) VALUES (?, 'Stale Podium Team 9904', 'nologo.png')`,
      [staleWinnerTeamId]
    );
    await runQuery(
      `INSERT INTO SeasonLeagueTeams (season_id, league_id, team_id, external_team_id, placement)
       VALUES (?, ?, ?, 'test-faction-stale-9904', 1)`,
      [S_ID, L_ID, staleWinnerTeamId]
    );
    await runQuery(
      `UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id = ? AND league_id = ? AND team_id = ?`,
      [S_ID, L_ID, TEAM_C.id]
    );
    await runQuery(
      `UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id = ? AND league_id = ? AND team_id = ?`,
      [S_ID, L_ID, TEAM_B.id]
    );

    const result = await assignGrandFinalPlacementsForFinishedMatch({
      id: 0,
      group: 3,
      round: 1,
      external_match_room_id: GF_ROOM_ID,
      season_id: S_ID,
      league_id: L_ID,
      stage: STAGE_ID
    });

    expect(result.applied).toBe(true);

    const placements = await getPlacements();
    expect(placements[staleWinnerTeamId]).toBeNull();
    expect(placements[TEAM_C.id]).toBe(1);
    expect(placements[TEAM_B.id]).toBe(2);
    expect(placements[TEAM_A.id]).toBe(3);

    const podiumCounts = await runQuery<
      Array<{ placement: number; count: number }>
    >(
      `SELECT placement, COUNT(*) AS count FROM SeasonLeagueTeams
       WHERE season_id = ? AND league_id = ? AND placement IN (1, 2, 3)
       GROUP BY placement`,
      [S_ID, L_ID]
    );
    for (const row of podiumCounts) {
      expect(row.count).toBe(1);
    }

    await runQuery(`DELETE FROM SeasonLeagueTeams WHERE team_id = ?`, [
      staleWinnerTeamId
    ]);
    await runQuery(`DELETE FROM Teams WHERE id = ?`, [staleWinnerTeamId]);
  });

  it("replayGrandFinalPlacements clears stale placements for season and league", async () => {
    await runQuery(
      `UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id = ? AND league_id = ? AND team_id = ?`,
      [S_ID, L_ID, TEAM_A.id]
    );

    const result = await replayGrandFinalPlacements({
      season_id: S_ID,
      league_id: L_ID
    });

    expect(result.applied).toBe(true);
    expect(result.placements).toEqual(
      expect.arrayContaining([
        {
          team_id: TEAM_C.id,
          placement: 1,
          team_name: TEAM_C.name
        },
        {
          team_id: TEAM_B.id,
          placement: 2,
          team_name: TEAM_B.name
        },
        {
          team_id: TEAM_A.id,
          placement: 3,
          team_name: TEAM_A.name
        }
      ])
    );

    const placements = await getPlacements();
    expect(placements[TEAM_C.id]).toBe(1);
    expect(placements[TEAM_B.id]).toBe(2);
    expect(placements[TEAM_A.id]).toBe(3);

    const duplicateFirst = await runQuery<Array<{ count: number }>>(
      `SELECT COUNT(*) AS count FROM SeasonLeagueTeams
       WHERE season_id = ? AND league_id = ? AND placement = 1`,
      [S_ID, L_ID]
    );
    expect(duplicateFirst[0]?.count).toBe(1);
  });

  it("assignGrandFinalPlacementsIfEligible skips non-grand-final match details", async () => {
    const details = { ...makeMatchDetails(), group: 1, round: 4 };
    const result = await assignGrandFinalPlacementsIfEligible({
      matchDetails: details,
      seasonId: S_ID,
      leagueId: L_ID,
      stageId: STAGE_ID
    });

    expect(result).toEqual({
      applied: false,
      skipped_reason: "not_grand_final",
      season_id: S_ID,
      league_id: L_ID,
      updated: []
    });
  });
});
