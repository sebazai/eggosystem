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
import { deleteMatchTeamMapVetoesByMatchId } from "../../../models/match-team-map-veto.models";
import matchRouter from "./match.routes";

jest.mock("../../../models/match.models", () => ({
  getMatch: jest.fn()
}));

jest.mock("../../../models/match-team-map-veto.models", () => ({
  deleteMatchTeamMapVetoesByMatchId: jest.fn()
}));

const mockGetMatch = jest.mocked(getMatch);
const mockDeleteVetoes = jest.mocked(deleteMatchTeamMapVetoesByMatchId);

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
      nickname: "t"
    });
    next();
  },
  checkPermissions: jest.requireActual("../../../middlewares/auth.middleware")
    .checkPermissions
}));

describe("DELETE /api/v1/dashboard/matches/:match_id/vetoes", () => {
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
  });

  afterEach(() => {
    cleanup();
  });

  it("returns 204 when match exists and vetoes are deleted", async () => {
    mockGetMatch.mockResolvedValue([{ id: 1 }] as never);
    mockDeleteVetoes.mockResolvedValue(3);

    const res = await request(app)
      .delete("/api/v1/dashboard/matches/1/vetoes")
      .set("Authorization", "Bearer x");

    expect(res.status).toBe(204);
    expect(mockGetMatch).toHaveBeenCalledWith(1);
    expect(mockDeleteVetoes).toHaveBeenCalledWith(1);
  });

  it("returns 204 even when no vetoes exist for the match", async () => {
    mockGetMatch.mockResolvedValue([{ id: 5 }] as never);
    mockDeleteVetoes.mockResolvedValue(0);

    const res = await request(app)
      .delete("/api/v1/dashboard/matches/5/vetoes")
      .set("Authorization", "Bearer x");

    expect(res.status).toBe(204);
  });

  it("returns 404 when match does not exist", async () => {
    mockGetMatch.mockResolvedValue([]);

    const res = await request(app)
      .delete("/api/v1/dashboard/matches/999/vetoes")
      .set("Authorization", "Bearer x");

    expect(res.status).toBe(404);
    expect(mockDeleteVetoes).not.toHaveBeenCalled();
  });

  it("returns 400 for non-numeric match_id", async () => {
    const res = await request(app)
      .delete("/api/v1/dashboard/matches/abc/vetoes")
      .set("Authorization", "Bearer x");

    expect(res.status).toBe(400);
    expect(mockGetMatch).not.toHaveBeenCalled();
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).delete("/api/v1/dashboard/matches/1/vetoes");

    expect(res.status).toBe(401);
    expect(mockGetMatch).not.toHaveBeenCalled();
  });
});
