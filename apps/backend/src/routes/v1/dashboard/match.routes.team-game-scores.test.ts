// Set environment variables before importing modules that depend on them
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
import { getMatchGameMetaForTeamScores } from "../../../models/match-game.models";
import {
  getTeamIdsForMatch,
  listTeamGameScoresByMatchGameId,
  saveStaffManualTeamGameScores
} from "../../../models/team-game-score.models";
import matchRouter from "./match.routes";

jest.mock("../../../models/match-game.models", () => ({
  getMatchGameMetaForTeamScores: jest.fn()
}));

jest.mock("../../../models/team-game-score.models", () => {
  const actual = jest.requireActual("../../../models/team-game-score.models");
  return {
    ...actual,
    getTeamIdsForMatch: jest.fn(),
    listTeamGameScoresByMatchGameId: jest.fn(),
    saveStaffManualTeamGameScores: jest.fn()
  };
});

const mockGetMeta = jest.mocked(getMatchGameMetaForTeamScores);
const mockList = jest.mocked(listTeamGameScoresByMatchGameId);
const mockTeamIds = jest.mocked(getTeamIdsForMatch);
const mockSave = jest.mocked(saveStaffManualTeamGameScores);

jest.mock("../../../middlewares/auth.middleware", () => ({
  authenticateJWT: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }
    (req as express.Request & { auth?: unknown }).auth = createMockUserPayload({
      account_id: 1,
      provider_id: "1",
      nickname: "t"
    });
    next();
  },
  checkPermissions: jest.requireActual("../../../middlewares/auth.middleware")
    .checkPermissions
}));

const scoreRowT = {
  id: 1,
  match_id: 10,
  team_id: 100,
  match_game_id: 55,
  starting_side: "T" as const,
  score: 13,
  halftime_score: 6,
  overtime_score: 0
};

const scoreRowCt = {
  id: 2,
  match_id: 10,
  team_id: 200,
  match_game_id: 55,
  starting_side: "CT" as const,
  score: 9,
  halftime_score: 6,
  overtime_score: 0
};

describe("dashboard match.routes team game scores", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const custom = express.Router();
    custom.use(authenticateJWT);
    const matchesSection = express.Router();
    matchesSection.use(
      checkPermissions({
        fallbackRoles: ["admin", "helpdesk"]
      }),
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
  });

  afterEach(() => {
    cleanup();
  });

  it("GET returns meta and teams when the match game exists", async () => {
    mockGetMeta.mockResolvedValue({
      id: 55,
      match_id: 10,
      regulation_rounds: 24,
      team_game_scores_staff_lock: 0
    });
    mockTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    mockList.mockResolvedValue([scoreRowT, scoreRowCt]);

    const res = await request(app)
      .get("/api/v1/dashboard/matches/games/55/team-game-scores")
      .set("Authorization", "Bearer x");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      match_id: 10,
      match_game_id: 55,
      regulation_rounds: 24,
      team_game_scores_staff_lock: false,
      match_team_ids: [100, 200]
    });
    expect(res.body.teams).toHaveLength(2);
  });

  it("PUT saves and returns team_game_scores_staff_lock true", async () => {
    mockGetMeta.mockResolvedValue({
      id: 55,
      match_id: 10,
      regulation_rounds: 24,
      team_game_scores_staff_lock: 0
    });
    mockTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);
    mockList.mockResolvedValue([scoreRowT, scoreRowCt]);
    mockSave.mockResolvedValue();

    const res = await request(app)
      .put("/api/v1/dashboard/matches/games/55/team-game-scores")
      .set("Authorization", "Bearer x")
      .send({
        teams: [
          {
            team_id: 100,
            starting_side: "T",
            score: 13,
            halftime_score: 6,
            overtime_score: 0
          },
          {
            team_id: 200,
            starting_side: "CT",
            score: 9,
            halftime_score: 6,
            overtime_score: 0
          }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.team_game_scores_staff_lock).toBe(true);
    expect(mockSave).toHaveBeenCalledWith({
      matchId: 10,
      matchGameId: 55,
      t: expect.objectContaining({
        team_id: 100,
        starting_side: "T",
        score: 13,
        halftime_score: 6,
        overtime_score: 0
      }),
      ct: expect.objectContaining({
        team_id: 200,
        starting_side: "CT",
        score: 9,
        halftime_score: 6,
        overtime_score: 0
      })
    });
  });

  it("rejects a body with the wrong MatchTeams with 400 and Zod issues", async () => {
    mockGetMeta.mockResolvedValue({
      id: 55,
      match_id: 10,
      regulation_rounds: 24,
      team_game_scores_staff_lock: 0
    });
    mockTeamIds.mockResolvedValue([{ team_id: 100 }, { team_id: 200 }]);

    const res = await request(app)
      .put("/api/v1/dashboard/matches/games/55/team-game-scores")
      .set("Authorization", "Bearer x")
      .send({
        teams: [
          {
            team_id: 100,
            starting_side: "T",
            score: 13,
            halftime_score: 6,
            overtime_score: 0
          },
          {
            team_id: 999,
            starting_side: "CT",
            score: 9,
            halftime_score: 6,
            overtime_score: 0
          }
        ]
      });

    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
    expect(mockSave).not.toHaveBeenCalled();
  });
});
