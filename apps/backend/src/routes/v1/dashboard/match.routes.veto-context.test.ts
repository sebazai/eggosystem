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
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../../../services/auth.services";
import {
  createMockUserPayload,
  type MatchVetoContext
} from "@eggosystem/types";
import { getMatchVetoContext } from "../../../models/match-veto-context.models";
import matchRouter from "./match.routes";

jest.mock("../../../services/auth.services", () => ({
  getPermissionsForAccountId: jest.fn(),
  getRolesForAccountId: jest.fn()
}));

jest.mock("../../../models/match-veto-context.models", () => ({
  getMatchVetoContext: jest.fn()
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
      nickname: "t"
    });
    next();
  },
  checkPermissions: jest.requireActual("../../../middlewares/auth.middleware")
    .checkPermissions
}));

const mockGetMatchVetoContext = jest.mocked(getMatchVetoContext);
const mockGetPermissions = jest.mocked(getPermissionsForAccountId);
const mockGetRoles = jest.mocked(getRolesForAccountId);

const mockVetoContext = {
  match_id: 10,
  stored_best_of: 3,
  default_veto_best_of: 3,
  recorded_veto_best_of: null,
  external_match_room_id: "room-faceit-test",
  best_of: 3,
  status: "READY",
  teams: [
    { team_id: 100, team_name: "Team A" },
    { team_id: 200, team_name: "Team B" }
  ],
  map_pool: [
    { id: 1, name: "Dust2" },
    { id: 2, name: "Inferno" }
  ],
  vetoes: [],
  template: null
} satisfies MatchVetoContext;

describe("dashboard match.routes veto-context", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
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

  it("GET /:match_id/veto-context returns 200 with context when match exists", async () => {
    mockGetMatchVetoContext.mockResolvedValue(mockVetoContext);

    const res = await request(app)
      .get("/api/v1/dashboard/matches/10/veto-context")
      .set("Authorization", "Bearer x");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockVetoContext);
    expect(mockGetMatchVetoContext).toHaveBeenCalledWith(10);
  });

  it("GET /:match_id/veto-context returns 404 when match is not found", async () => {
    mockGetMatchVetoContext.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/v1/dashboard/matches/99999/veto-context")
      .set("Authorization", "Bearer x");

    expect(res.status).toBe(404);
    expect(mockGetMatchVetoContext).toHaveBeenCalledWith(99999);
  });
});
