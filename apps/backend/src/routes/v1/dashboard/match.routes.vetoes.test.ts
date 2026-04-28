process.env.FRONTEND_URL = "http://localhost:3000";
process.env.BACKEND_SERVICE_API_KEY = "test-api-key";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../../test-utils";
import {
  authenticateJWT,
  checkPermissions
} from "../../../middlewares/auth.middleware";
import { createMockUserPayload } from "@eggosystem/types";
import { getMatch } from "../../../models/match.models";
import { getTeamIdsForMatch } from "../../../models/team-game-score.models";
import { getActiveMapPoolBySeasonId } from "../../../models/season-active-map-pool.models";
import { createMatchVetoSteps } from "../../../models/match-team-map-veto.models";
import { getConnection } from "../../../db/mysqlConnection";
import matchRouter from "./match.routes";
import type { PoolConnection } from "mysql2/promise";

jest.mock("../../../db/mysqlRunQuery");

jest.mock("../../../services/auth.services");
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../../../services/auth.services";

const mockGetPermissions = getPermissionsForAccountId as jest.MockedFunction<
  typeof getPermissionsForAccountId
>;
const mockGetRoles = getRolesForAccountId as jest.MockedFunction<
  typeof getRolesForAccountId
>;

jest.mock("../../../models/match.models", () => ({
  ...jest.requireActual("../../../models/match.models"),
  getMatch: jest.fn()
}));

jest.mock("../../../models/team-game-score.models", () => ({
  ...jest.requireActual("../../../models/team-game-score.models"),
  getTeamIdsForMatch: jest.fn()
}));

jest.mock("../../../models/season-active-map-pool.models", () => ({
  ...jest.requireActual("../../../models/season-active-map-pool.models"),
  getActiveMapPoolBySeasonId: jest.fn()
}));

jest.mock("../../../models/match-team-map-veto.models", () => ({
  ...jest.requireActual("../../../models/match-team-map-veto.models"),
  createMatchVetoSteps: jest.fn()
}));

const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockRelease = jest.fn();
const mockBeginTransaction = jest.fn();

jest.mock("../../../db/mysqlConnection", () => ({
  getConnection: jest.fn()
}));

jest.mock("../../../middlewares/auth.middleware", () => ({
  authenticateJWT: (
    req: express.Request & { auth?: unknown },
    res: express.Response,
    next: express.NextFunction
  ) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }
    req.auth = createMockUserPayload({
      account_id: 1,
      provider_id: "1",
      nickname: "admin"
    });
    next();
  },
  checkPermissions: jest.requireActual("../../../middlewares/auth.middleware")
    .checkPermissions
}));

const mockGetMatch = jest.mocked(getMatch);
const mockGetTeamIds = jest.mocked(getTeamIdsForMatch);
const mockGetMapPool = jest.mocked(getActiveMapPoolBySeasonId);
const mockCreateSteps = jest.mocked(createMatchVetoSteps);
const mockGetConnection = jest.mocked(getConnection);

const bo3Match = {
  id: 10,
  league_id: 1,
  season_id: 14,
  stage: 1,
  best_of: 3,
  external_match_room_id: null,
  group: null,
  round: null,
  status: "SCHEDULED" as const,
  created_at: new Date(),
  updated_at: new Date(),
  start_timestamp: new Date(),
  end_timestamp: null
};

const validBo3Steps = [
  { team_id: 100, map_id: 1, veto_order: 1 },
  { team_id: 200, map_id: 2, veto_order: 2 },
  { team_id: 100, map_id: 3, veto_order: 3 },
  { team_id: 200, map_id: 4, veto_order: 4 },
  { team_id: 100, map_id: 5, veto_order: 5 },
  { team_id: 200, map_id: 6, veto_order: 6 },
  { team_id: 100, map_id: 7, veto_order: 7 }
];

describe("POST /api/v1/dashboard/matches/:match_id/vetoes", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const custom = express.Router();
    custom.use(authenticateJWT);
    const matchesSection = express.Router();
    matchesSection.use(
      checkPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
      matchRouter
    );
    custom.use("/matches", matchesSection);
    const { app: testApp, cleanup: c } = createExpressTestApp(
      custom,
      "/api/v1/dashboard"
    );
    app = testApp;
    cleanup = c;
    jest.clearAllMocks();

    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    mockGetConnection.mockResolvedValue({
      beginTransaction: mockBeginTransaction,
      commit: mockCommit,
      rollback: mockRollback,
      release: mockRelease
    } as unknown as PoolConnection);
  });

  afterEach(() => {
    cleanup();
  });

  it("creates veto steps and returns 201", async () => {
    mockGetMatch.mockResolvedValue([bo3Match]);
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    mockGetMapPool.mockResolvedValue([1, 2, 3, 4, 5, 6, 7]);
    mockCreateSteps.mockResolvedValue(
      validBo3Steps.map((s, i) => ({
        id: i + 1,
        match_id: 10,
        team_id: s.team_id,
        map_id: s.map_id,
        action: i < 2 ? "drop" : i < 4 ? "pick" : i < 6 ? "drop" : "decider",
        veto_order: s.veto_order
      }))
    );

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send({ steps: validBo3Steps });

    expect(res.status).toBe(201);
    expect(res.body.match_id).toBe(10);
    expect(res.body.vetoes).toHaveLength(7);
    expect(mockBeginTransaction).toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalled();
    expect(mockRelease).toHaveBeenCalled();
  });

  it("returns 404 when match not found", async () => {
    mockGetMatch.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/v1/dashboard/matches/999/vetoes")
      .set("Authorization", "Bearer x")
      .send({ steps: validBo3Steps });

    expect(res.status).toBe(404);
  });

  it("returns 400 when step count does not match template", async () => {
    mockGetMatch.mockResolvedValue([bo3Match]);

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send({ steps: validBo3Steps.slice(0, 3) });

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/Expected 7 veto steps/);
  });

  it("returns 400 when team_id is not a match participant", async () => {
    mockGetMatch.mockResolvedValue([bo3Match]);
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);

    const badSteps = validBo3Steps.map((s, i) =>
      i === 0 ? { ...s, team_id: 999 } : s
    );

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send({ steps: badSteps });

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/team_id 999 is not a participant/);
  });

  it("returns 400 when map_id is not in the active map pool", async () => {
    mockGetMatch.mockResolvedValue([bo3Match]);
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    mockGetMapPool.mockResolvedValue([1, 2, 3, 4, 5, 6]);

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send({ steps: validBo3Steps });

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/map_id 7 is not in the active map pool/);
  });

  it("returns 400 when duplicate map_id values exist", async () => {
    mockGetMatch.mockResolvedValue([bo3Match]);
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    mockGetMapPool.mockResolvedValue([1, 2, 3, 4, 5, 6, 7]);

    const dupSteps = validBo3Steps.map((s, i) =>
      i === 6 ? { ...s, map_id: 1 } : s
    );

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send({ steps: dupSteps });

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/Duplicate map_id/);
  });

  it("returns 400 when veto_order values are not sequential", async () => {
    mockGetMatch.mockResolvedValue([bo3Match]);

    const badOrders = validBo3Steps.map((s, i) => ({
      ...s,
      veto_order: i === 0 ? 10 : s.veto_order
    }));

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send({ steps: badOrders });

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/veto_order values must be sequential/);
  });

  it("rolls back the transaction on model error", async () => {
    mockGetMatch.mockResolvedValue([bo3Match]);
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    mockGetMapPool.mockResolvedValue([1, 2, 3, 4, 5, 6, 7]);
    mockCreateSteps.mockRejectedValue(new Error("DB error"));

    await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send({ steps: validBo3Steps });

    expect(mockRollback).toHaveBeenCalled();
    expect(mockRelease).toHaveBeenCalled();
    expect(mockCommit).not.toHaveBeenCalled();
  });

  it("returns 400 when body is empty", async () => {
    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 400 when best_of has no template", async () => {
    mockGetMatch.mockResolvedValue([{ ...bo3Match, best_of: 2 }]);

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send({ steps: validBo3Steps });

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/No veto template/);
  });
});
