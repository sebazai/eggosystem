process.env.FRONTEND_URL = "http://localhost:3000";
process.env.BACKEND_SERVICE_API_KEY = "test-api-key";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../../test-utils";
import {
  authenticateJWT,
  checkPermissions
} from "../../../middlewares/auth.middleware";
import { runQuery } from "../../../db/mysqlRunQuery";
import matchRouter from "./match.routes";

jest.mock("../../../middlewares/auth.middleware", () => ({
  authenticateJWT: (
    req: express.Request & { auth?: unknown },
    _res: express.Response,
    next: express.NextFunction
  ) => {
    req.auth = {
      account_id: 1,
      provider: "steam" as const,
      provider_id: "76561198028510846",
      permissions: [],
      roles: ["admin"],
      nickname: "Integration Admin",
      jti: "test-jti-veto-integration"
    };
    next();
  },
  checkPermissions: jest.fn(
    () => (_req: unknown, _res: unknown, next: express.NextFunction) => next()
  )
}));

const TEST_SEASON_ID = 8888338;
const TEST_LEAGUE_ID = 8889338;
const TEST_MATCH_ID = 88883380;
const TEST_TEAM_A_ID = 88883381;
const TEST_TEAM_B_ID = 88883382;

function isUnknownColumnError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "ER_BAD_FIELD_ERROR"
  );
}

async function insertTestMatchRow(): Promise<void> {
  try {
    await runQuery(
      `INSERT INTO Matches (id, league_id, season_id, stage, best_of, start_timestamp, end_timestamp)
       VALUES (?, ?, ?, 1, 3, '2025-01-15 18:00:00', '2025-01-15 23:59:00')`,
      [TEST_MATCH_ID, TEST_LEAGUE_ID, TEST_SEASON_ID]
    );
  } catch (e: unknown) {
    if (
      isUnknownColumnError(e) &&
      e !== null &&
      typeof e === "object" &&
      "message" in e &&
      typeof (e as { message: unknown }).message === "string" &&
      (e as { message: string }).message.includes("start_timestamp")
    ) {
      await runQuery(
        `INSERT INTO Matches (id, league_id, season_id, stage, best_of, match_date, start_time, end_time)
         VALUES (?, ?, ?, 1, 3, '2025-01-15', '18:00:00', '23:59:00')`,
        [TEST_MATCH_ID, TEST_LEAGUE_ID, TEST_SEASON_ID]
      );
      return;
    }
    throw e;
  }
}

async function loadSevenMapIds(): Promise<number[]> {
  const mapRows = await runQuery<Array<{ id: number }>>(
    "SELECT id FROM Maps ORDER BY id ASC LIMIT 7"
  );
  if (mapRows.length < 7) {
    throw new Error(
      "match.routes.vetoes.integration.test requires at least 7 rows in Maps"
    );
  }
  return mapRows.map((r) => r.id);
}

/** BO3 template: seven steps with distinct maps from the DB pool */
function buildValidBo3Steps(teamA: number, teamB: number, mapIds: number[]) {
  if (mapIds.length !== 7) {
    throw new Error("buildValidBo3Steps expects exactly 7 map ids");
  }
  return [
    { team_id: teamA, map_id: mapIds[0], veto_order: 1 },
    { team_id: teamB, map_id: mapIds[1], veto_order: 2 },
    { team_id: teamA, map_id: mapIds[2], veto_order: 3 },
    { team_id: teamB, map_id: mapIds[3], veto_order: 4 },
    { team_id: teamA, map_id: mapIds[4], veto_order: 5 },
    { team_id: teamB, map_id: mapIds[5], veto_order: 6 },
    { team_id: teamB, map_id: mapIds[6], veto_order: 7 }
  ];
}

/** Body for POST …/vetoes — must match `createVetoStepsBodySchema` */
function buildCreateVetoBody(
  steps: ReturnType<typeof buildValidBo3Steps>,
  voteStarterTeamId: number = TEST_TEAM_A_ID
) {
  return {
    vote_starter_team_id: voteStarterTeamId,
    steps
  };
}

describe("dashboard match veto routes (integration)", () => {
  let app: express.Application;
  let cleanupApp: () => void;
  let seededMapIds: number[] = [];

  beforeAll(() => {
    const custom = express.Router();
    custom.use(authenticateJWT);
    const matchesSection = express.Router();
    matchesSection.use(
      checkPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
      matchRouter
    );
    custom.use("/matches", matchesSection);
    const { app: testApp, cleanup } = createExpressTestApp(
      custom,
      "/api/v1/dashboard"
    );
    app = testApp;
    cleanupApp = cleanup;
  });

  afterAll(() => {
    cleanupApp();
  });

  async function cleanupTestData(): Promise<void> {
    await runQuery("DELETE FROM MatchTeamMapVetoes WHERE match_id = ?", [
      TEST_MATCH_ID
    ]);
    await runQuery("DELETE FROM MatchTeams WHERE match_id = ?", [
      TEST_MATCH_ID
    ]);
    await runQuery("DELETE FROM Matches WHERE id = ?", [TEST_MATCH_ID]);
    await runQuery("DELETE FROM SeasonActiveMapPool WHERE season_id = ?", [
      TEST_SEASON_ID
    ]);
    await runQuery("DELETE FROM SeasonLeagueTeams WHERE season_id = ?", [
      TEST_SEASON_ID
    ]);
    await runQuery("DELETE FROM SeasonTeamRegistrations WHERE season_id = ?", [
      TEST_SEASON_ID
    ]);
    await runQuery("DELETE FROM Teams WHERE id IN (?, ?)", [
      TEST_TEAM_A_ID,
      TEST_TEAM_B_ID
    ]);
    await runQuery("DELETE FROM SeasonLeagues WHERE season_id = ?", [
      TEST_SEASON_ID
    ]);
    await runQuery("DELETE FROM Leagues WHERE id = ?", [TEST_LEAGUE_ID]);
    await runQuery("DELETE FROM Seasons WHERE id = ?", [TEST_SEASON_ID]);
  }

  async function seedTestData(): Promise<void> {
    await runQuery(
      `INSERT INTO Seasons (id, game_id, name, full_name, start_date, end_date, platform)
       VALUES (?, 1, 'Veto IT Season', 'Veto IT Season', '2024-01-01', '2025-12-31', 'faceit')`,
      [TEST_SEASON_ID]
    );
    await runQuery(
      `INSERT INTO Leagues (id, name, sort_priority) VALUES (?, 'Veto IT League', 1)`,
      [TEST_LEAGUE_ID]
    );
    await runQuery(
      `INSERT INTO SeasonLeagues (season_id, league_id, tier) VALUES (?, ?, 1)`,
      [TEST_SEASON_ID, TEST_LEAGUE_ID]
    );
    await runQuery(
      `INSERT INTO Teams (id, organization_id, name, team_logo)
       VALUES (?, NULL, 'Veto IT Team A', 'a.png'), (?, NULL, 'Veto IT Team B', 'b.png')`,
      [TEST_TEAM_A_ID, TEST_TEAM_B_ID]
    );
    await runQuery(
      `INSERT INTO SeasonTeamRegistrations (season_id, team_id, approved, terms_and_conditions_approved, external_platform_id)
       VALUES (?, ?, 1, 1, ?), (?, ?, 1, 1, ?)`,
      [
        TEST_SEASON_ID,
        TEST_TEAM_A_ID,
        `veto-reg-${TEST_TEAM_A_ID}`,
        TEST_SEASON_ID,
        TEST_TEAM_B_ID,
        `veto-reg-${TEST_TEAM_B_ID}`
      ]
    );
    await runQuery(
      `INSERT INTO SeasonLeagueTeams (season_id, team_id, league_id)
       VALUES (?, ?, ?), (?, ?, ?)`,
      [
        TEST_SEASON_ID,
        TEST_TEAM_A_ID,
        TEST_LEAGUE_ID,
        TEST_SEASON_ID,
        TEST_TEAM_B_ID,
        TEST_LEAGUE_ID
      ]
    );
    await insertTestMatchRow();
    await runQuery(
      `INSERT INTO MatchTeams (match_id, team_id, season_id, league_id)
       VALUES (?, ?, ?, ?), (?, ?, ?, ?)`,
      [
        TEST_MATCH_ID,
        TEST_TEAM_A_ID,
        TEST_SEASON_ID,
        TEST_LEAGUE_ID,
        TEST_MATCH_ID,
        TEST_TEAM_B_ID,
        TEST_SEASON_ID,
        TEST_LEAGUE_ID
      ]
    );
    const mapIds = await loadSevenMapIds();
    seededMapIds = mapIds;
    for (const mapId of mapIds) {
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?)`,
        [TEST_SEASON_ID, mapId]
      );
    }
  }

  beforeEach(async () => {
    await cleanupTestData();
    await seedTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it("POST /vetoes creates rows and GET veto-context returns vetoes and template", async () => {
    expect(seededMapIds).toHaveLength(7);

    const matchTeams = await runQuery<Array<{ team_id: number }>>(
      "SELECT team_id FROM MatchTeams WHERE match_id = ? ORDER BY team_id ASC",
      [TEST_MATCH_ID]
    );
    expect(matchTeams).toHaveLength(2);

    const steps = buildValidBo3Steps(
      TEST_TEAM_A_ID,
      TEST_TEAM_B_ID,
      seededMapIds
    );

    const postRes = await request(app)
      .post(`/api/v1/dashboard/matches/${TEST_MATCH_ID}/vetoes`)
      .send(buildCreateVetoBody(steps));

    expect(postRes.status).toBe(201);
    expect(postRes.body.match_id).toBe(TEST_MATCH_ID);
    expect(postRes.body.vetoes).toHaveLength(7);

    const statusAfter = await runQuery<Array<{ status: string }>>(
      "SELECT status FROM Matches WHERE id = ?",
      [TEST_MATCH_ID]
    );
    expect(statusAfter[0]?.status).toBe("ONGOING");

    const countRows = await runQuery<Array<{ c: number }>>(
      "SELECT COUNT(*) AS c FROM MatchTeamMapVetoes WHERE match_id = ?",
      [TEST_MATCH_ID]
    );
    expect(Number(countRows[0]?.c)).toBe(7);

    const ctxRes = await request(app).get(
      `/api/v1/dashboard/matches/${TEST_MATCH_ID}/veto-context`
    );
    expect(ctxRes.status).toBe(200);
    expect(ctxRes.body.match_id).toBe(TEST_MATCH_ID);
    expect(ctxRes.body.stored_best_of).toBe(3);
    expect(ctxRes.body.default_veto_best_of).toBe(3);
    expect(ctxRes.body.recorded_veto_best_of).toBe(3);
    expect(ctxRes.body.best_of).toBe(3);
    expect(ctxRes.body.vetoes).toHaveLength(7);
    expect(ctxRes.body.template).toMatchObject({ bestOf: 3 });
    expect(Array.isArray(ctxRes.body.map_pool)).toBe(true);
    expect(ctxRes.body.map_pool.length).toBeGreaterThanOrEqual(7);
  });

  it("POST /vetoes returns 400 for validation errors (non-participant team)", async () => {
    const steps = buildValidBo3Steps(
      TEST_TEAM_A_ID,
      TEST_TEAM_B_ID,
      seededMapIds
    ).map((s, i) => (i === 0 ? { ...s, team_id: 999000001 } : s));

    const res = await request(app)
      .post(`/api/v1/dashboard/matches/${TEST_MATCH_ID}/vetoes`)
      .send(buildCreateVetoBody(steps));

    expect(res.status).toBe(400);
    expect(String(res.body.detail)).toMatch(/not a participant/i);
    const countRows = await runQuery<Array<{ c: number }>>(
      "SELECT COUNT(*) AS c FROM MatchTeamMapVetoes WHERE match_id = ?",
      [TEST_MATCH_ID]
    );
    expect(Number(countRows[0]?.c)).toBe(0);
  });

  it("POST /vetoes returns 409 when vetoes already exist (idempotent conflict)", async () => {
    const steps = buildValidBo3Steps(
      TEST_TEAM_A_ID,
      TEST_TEAM_B_ID,
      seededMapIds
    );

    const first = await request(app)
      .post(`/api/v1/dashboard/matches/${TEST_MATCH_ID}/vetoes`)
      .send(buildCreateVetoBody(steps));
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/v1/dashboard/matches/${TEST_MATCH_ID}/vetoes`)
      .send(buildCreateVetoBody(steps));
    expect(second.status).toBe(409);
    expect(String(second.body.detail)).toMatch(/already exist/);
  });

  it("DELETE /vetoes clears rows and POST can succeed again", async () => {
    const steps = buildValidBo3Steps(
      TEST_TEAM_A_ID,
      TEST_TEAM_B_ID,
      seededMapIds
    );

    await request(app)
      .post(`/api/v1/dashboard/matches/${TEST_MATCH_ID}/vetoes`)
      .send(buildCreateVetoBody(steps))
      .expect(201);

    await request(app)
      .delete(`/api/v1/dashboard/matches/${TEST_MATCH_ID}/vetoes`)
      .expect(204);

    const afterDelete = await runQuery<Array<{ c: number }>>(
      "SELECT COUNT(*) AS c FROM MatchTeamMapVetoes WHERE match_id = ?",
      [TEST_MATCH_ID]
    );
    expect(Number(afterDelete[0]?.c)).toBe(0);

    const again = await request(app)
      .post(`/api/v1/dashboard/matches/${TEST_MATCH_ID}/vetoes`)
      .send(buildCreateVetoBody(steps));
    expect(again.status).toBe(201);
    expect(again.body.vetoes).toHaveLength(7);
  });

  it("GET veto-context returns empty vetoes before POST", async () => {
    const ctxRes = await request(app).get(
      `/api/v1/dashboard/matches/${TEST_MATCH_ID}/veto-context`
    );
    expect(ctxRes.status).toBe(200);
    expect(ctxRes.body.vetoes).toEqual([]);
    expect(ctxRes.body.stored_best_of).toBe(3);
    expect(ctxRes.body.default_veto_best_of).toBe(3);
    expect(ctxRes.body.recorded_veto_best_of).toBeNull();
    expect(ctxRes.body.external_match_room_id).toBeNull();
  });
});
