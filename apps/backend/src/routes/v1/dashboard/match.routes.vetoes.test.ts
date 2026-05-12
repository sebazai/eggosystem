process.env.FRONTEND_URL = "http://localhost:3000";
process.env.BACKEND_SERVICE_API_KEY = "test-api-key";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../../test-utils";
import {
  authenticateJWT,
  checkPermissions
} from "../../../middlewares/auth.middleware";
import { createMockUserPayload, MatchStatus } from "@eggosystem/types";
import * as matchModels from "../../../models/match.models";
import { getMatchVetoSeasonMeta } from "../../../models/match-veto-context.models";
import { getTeamIdsForMatch } from "../../../models/team-game-score.models";
import { getSeasonMapPoolForMatch } from "../../../models/season-active-map-pool.models";
import {
  countExistingVetoStepsForMatch,
  createMatchVetoSteps
} from "../../../models/match-team-map-veto.models";
import { getConnection } from "../../../db/mysqlConnection";
import matchRouter from "./match.routes";
import type { PoolConnection } from "mysql2/promise";
import type { Match } from "@eggosystem/types";

jest.mock("../../../db/mysqlRunQuery");

jest.mock("../../../models/match.models", () => ({
  ...jest.requireActual<typeof import("../../../models/match.models")>(
    "../../../models/match.models"
  ),
  updateMatchStatusByMatchId: jest.fn().mockResolvedValue(undefined)
}));

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

jest.mock("../../../models/match-veto-context.models", () => {
  const actual = jest.requireActual<
    typeof import("../../../models/match-veto-context.models")
  >("../../../models/match-veto-context.models");
  return {
    ...actual,
    getMatchVetoSeasonMeta: jest.fn()
  };
});

jest.mock("../../../models/team-game-score.models", () => ({
  ...jest.requireActual("../../../models/team-game-score.models"),
  getTeamIdsForMatch: jest.fn()
}));

jest.mock("../../../models/season-active-map-pool.models", () => ({
  ...jest.requireActual("../../../models/season-active-map-pool.models"),
  getSeasonMapPoolForMatch: jest.fn()
}));

jest.mock("../../../models/match-team-map-veto.models", () => ({
  ...jest.requireActual("../../../models/match-team-map-veto.models"),
  createMatchVetoSteps: jest.fn(),
  countExistingVetoStepsForMatch: jest.fn()
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

const mockGetSeasonMeta = jest.mocked(getMatchVetoSeasonMeta);
const mockGetTeamIds = jest.mocked(getTeamIdsForMatch);
const mockGetSeasonMapPoolForMatch = jest.mocked(getSeasonMapPoolForMatch);
const mockCountExistingVetoes = jest.mocked(countExistingVetoStepsForMatch);
const mockCreateSteps = jest.mocked(createMatchVetoSteps);
const mockGetConnection = jest.mocked(getConnection);
const mockUpdateMatchStatusByMatchId = jest.mocked(
  matchModels.updateMatchStatusByMatchId
);

const bo3Match = {
  id: 10,
  league_id: 1,
  season_id: 14,
  stage: 1,
  best_of: 3,
  external_match_room_id: null,
  group: 1,
  round: 1,
  status: "SCHEDULED",
  start_timestamp: "2025-01-01T00:00:00.000Z",
  end_timestamp: null
} satisfies Match;

const bo3SeasonMeta = {
  match_id: bo3Match.id,
  stored_best_of: bo3Match.best_of,
  status: bo3Match.status,
  stage: bo3Match.stage,
  external_match_room_id: bo3Match.external_match_room_id,
  is_round_robin_bo2_as_2xbo1: false
};

const validBo3Steps = [
  { team_id: 100, map_id: 1, veto_order: 1 },
  { team_id: 200, map_id: 2, veto_order: 2 },
  { team_id: 100, map_id: 3, veto_order: 3 },
  { team_id: 200, map_id: 4, veto_order: 4 },
  { team_id: 100, map_id: 5, veto_order: 5 },
  { team_id: 200, map_id: 6, veto_order: 6 },
  { team_id: 200, map_id: 7, veto_order: 7 }
];

const bo3VetoBody = (
  steps: (typeof validBo3Steps)[number][],
  voteStarterTeamId = 100
) => ({
  vote_starter_team_id: voteStarterTeamId,
  steps
});

/** Starter team 200: steps 1,3,5 → 200; 2,4,6 → 100; BO3 decider (7) acts same side as step 6 → 100 */
const bo3StepsVoteStarter200 = validBo3Steps.map((s) => ({
  ...s,
  team_id: s.veto_order === 7 ? 100 : s.veto_order % 2 === 1 ? 200 : 100
}));

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
    mockGetSeasonMeta.mockResolvedValue(bo3SeasonMeta);

    mockGetSeasonMapPoolForMatch.mockResolvedValue(
      [1, 2, 3, 4, 5, 6, 7].map((id) => ({ id, name: `Map ${id}` }))
    );
    mockCountExistingVetoes.mockResolvedValue(0);
    mockCreateSteps.mockResolvedValue([]);

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
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
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
      .send(bo3VetoBody(validBo3Steps));

    expect(res.status).toBe(201);
    expect(res.body.match_id).toBe(10);
    expect(res.body.vetoes).toHaveLength(7);
    expect(mockBeginTransaction).toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalled();
    expect(mockRelease).toHaveBeenCalled();
    expect(mockUpdateMatchStatusByMatchId).toHaveBeenCalledWith(
      10,
      MatchStatus.ONGOING,
      expect.any(Object)
    );
  });

  it("creates veto steps when vote_starter_team_id is the higher team id (B starts)", async () => {
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    mockCreateSteps.mockResolvedValue(
      bo3StepsVoteStarter200.map((s, i) => ({
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
      .send(bo3VetoBody(bo3StepsVoteStarter200, 200));

    expect(res.status).toBe(201);
    expect(mockUpdateMatchStatusByMatchId).toHaveBeenCalledWith(
      10,
      MatchStatus.ONGOING,
      expect.any(Object)
    );
  });

  it("does not set ONGOING when match is in a terminal status", async () => {
    mockGetSeasonMeta.mockResolvedValue({
      ...bo3SeasonMeta,
      status: "FINISHED"
    });
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
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
      .send(bo3VetoBody(validBo3Steps));

    expect(res.status).toBe(201);
    expect(mockUpdateMatchStatusByMatchId).not.toHaveBeenCalled();
  });

  it("returns 400 when veto step team_id breaks alternating order for vote_starter_team_id", async () => {
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);

    const wrongAlternation = validBo3Steps.map((s) =>
      s.veto_order === 2 ? { ...s, team_id: 100 } : s
    );

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(wrongAlternation));

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(
      /veto_order 2 must be performed by team_id 200/
    );
  });

  it("returns 400 when BO3 decider step uses vote starter instead of other team", async () => {
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    const wrongDeciderTeam = validBo3Steps.map((s) =>
      s.veto_order === 7 ? { ...s, team_id: 100 } : s
    );

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(wrongDeciderTeam));

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(
      /veto_order 7 must be performed by team_id 200/
    );
  });

  it("returns 400 when vote_starter_team_id is not a match participant", async () => {
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(validBo3Steps, 999));

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(
      /vote_starter_team_id 999 is not a participant/
    );
  });

  it("returns 404 when match not found", async () => {
    mockGetSeasonMeta.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/v1/dashboard/matches/999/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(validBo3Steps));

    expect(res.status).toBe(404);
  });

  it("returns 400 when step count does not match template", async () => {
    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(validBo3Steps.slice(0, 3)));

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/Expected 7 veto steps/);
  });

  it("returns 400 when team_id is not a match participant", async () => {
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);

    const badSteps = validBo3Steps.map((s, i) =>
      i === 0 ? { ...s, team_id: 999 } : s
    );

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(badSteps));

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/team_id 999 is not a participant/);
  });

  it("returns 400 when map_id is not in the active map pool", async () => {
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    mockGetSeasonMapPoolForMatch.mockResolvedValue(
      [1, 2, 3, 4, 5, 6].map((id) => ({ id, name: `Map ${id}` }))
    );

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(validBo3Steps));

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(
      /map_id 7 is not in the active map pool for this match/
    );
  });

  it("returns 400 when duplicate map_id values exist", async () => {
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);

    const dupSteps = validBo3Steps.map((s, i) =>
      i === 6 ? { ...s, map_id: 1 } : s
    );

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(dupSteps));

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/Duplicate map_id/);
  });

  it("returns 400 when veto_order values are not sequential", async () => {
    const badOrders = validBo3Steps.map((s, i) => ({
      ...s,
      veto_order: i === 0 ? 10 : s.veto_order
    }));

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(badOrders));

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/veto_order values must be sequential/);
  });

  it("rolls back the transaction on model error", async () => {
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    mockCreateSteps.mockRejectedValue(new Error("DB error"));

    await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(validBo3Steps));

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

  it("returns 409 when veto steps already exist for this match", async () => {
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    mockCountExistingVetoes.mockResolvedValue(3);

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(validBo3Steps));

    expect(res.status).toBe(409);
    expect(res.body.detail).toMatch(/Map veto steps already exist/);
    expect(mockRollback).toHaveBeenCalled();
    expect(mockCreateSteps).not.toHaveBeenCalled();
  });

  it("returns 409 when insert hits duplicate veto key (race)", async () => {
    mockGetTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    mockCreateSteps.mockRejectedValue({
      code: "ER_DUP_ENTRY",
      sqlMessage:
        "Duplicate entry '10-100-1' for key 'matchteammapvetoes_match_id_team_id_veto_order_unique'"
    });

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(validBo3Steps));

    expect(res.status).toBe(409);
    expect(mockRollback).toHaveBeenCalled();
  });

  it("returns 400 when best_of has no template", async () => {
    mockGetSeasonMeta.mockResolvedValue({
      ...bo3SeasonMeta,
      stored_best_of: 4
    });

    const res = await request(app)
      .post("/api/v1/dashboard/matches/10/vetoes")
      .set("Authorization", "Bearer x")
      .send(bo3VetoBody(validBo3Steps));

    expect(res.status).toBe(400);
    expect(res.body.detail).toMatch(/No veto template/);
  });
});
