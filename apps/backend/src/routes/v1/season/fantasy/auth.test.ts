// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.BACKEND_SERVICE_API_KEY = "test-api-key";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../../../test-utils";
import seasonRouter from "../../season.routes";
import { authenticateJWT } from "../../../../middlewares/auth.middleware";

// Mock the auth services
jest.mock("../../../../services/auth.services");
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../../../../services/auth.services";

const mockGetPermissionsForAccountId =
  getPermissionsForAccountId as jest.MockedFunction<
    typeof getPermissionsForAccountId
  >;
const mockGetRolesForAccountId = getRolesForAccountId as jest.MockedFunction<
  typeof getRolesForAccountId
>;

// Mock JWT authentication
jest.mock("../../../../middlewares/auth.middleware", () => {
  const actual = jest.requireActual("../../../../middlewares/auth.middleware");
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authenticateJWT: (req: any, res: any, next: any) => {
      // Check if Authorization header is present
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        // No authentication - return 401
        return res.status(401).json({
          type: "about:blank",
          title: "Unauthorized",
          status: 401,
          detail: "Forbidden: Requires authentication"
        });
      }

      // Mock authenticated user
      req.auth = {
        account_id: 1,
        provider: "steam",
        provider_id: "12345",
        permissions: [],
        roles: [],
        nickname: "testuser",
        jti: "test-jti"
      };
      next();
    },
    checkPermissions: actual.checkPermissions,
    checkJWTPermissions: actual.checkJWTPermissions
  };
});

// Mock fantasy controllers and models to avoid database calls
jest.mock("../../../../controllers/fantasy.controllers", () => ({
  getFantasyPlayersByLeagueController: jest.fn((req, res) => {
    res.status(200).json([]);
  }),
  createFantasyTeamController: jest.fn((req, res) => {
    res.status(201).json({ id: 1 });
  }),
  getMyFantasyTeamController: jest.fn((req, res) => {
    res.status(200).json({ id: 1, players: [] });
  }),
  substitutePlayerController: jest.fn((req, res) => {
    res.status(200).json({ success: true });
  }),
  updatePlayerRolesController: jest.fn((req, res) => {
    res.status(200).json({ success: true });
  }),
  getFantasyLeaderboardController: jest.fn((req, res) => {
    res.status(200).json({ leaderboard: [] });
  }),
  getFantasyOverallLeaderboardController: jest.fn((req, res) => {
    res.status(200).json({ leaderboard: [] });
  }),
  getFantasyPriceHistoryController: jest.fn((req, res) => {
    res.status(200).json([]);
  }),
  seedInitialPlayerValuesController: jest.fn((req, res) => {
    res.status(200).json({ success: true });
  }),
  getTopPerformingPlayersController: jest.fn((req, res) => {
    res.status(200).json([]);
  }),
  getPlayerPointHistoryController: jest.fn((req, res) => {
    res.status(200).json([]);
  })
}));
jest.mock("../../../../models/fantasy.models");
jest.mock("../../../../db/mysqlRunQuery");
jest.mock("../../../../services/fantasy-value.service");
jest.mock("../../../../utils/week-calculation");

describe("Fantasy Routes Authentication Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    // Use the season router directly - it already has authenticateJWT where needed
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      seasonRouter,
      "/api/v1/seasons"
    );
    app = testApp;
    cleanup = appCleanup;

    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Unauthenticated Access", () => {
    it("should return 401 for POST /:season_id/fantasy/teams without auth", async () => {
      const response = await request(app)
        .post("/api/v1/seasons/1/fantasy/teams")
        .send({ league_id: 1, players: [] })
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for GET /:season_id/fantasy/teams/me without auth", async () => {
      const response = await request(app)
        .get("/api/v1/seasons/1/fantasy/teams/me")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for PUT /:season_id/fantasy/teams/me/players without auth", async () => {
      const response = await request(app)
        .put("/api/v1/seasons/1/fantasy/teams/me/players")
        .send({})
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for PUT /:season_id/fantasy/teams/me/roles without auth", async () => {
      const response = await request(app)
        .put("/api/v1/seasons/1/fantasy/teams/me/roles")
        .send({})
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for GET /:season_id/fantasy/teams/me/players/:player_id/points without auth", async () => {
      const response = await request(app)
        .get("/api/v1/seasons/1/fantasy/teams/me/players/12345/points")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for POST /:season_id/fantasy/leagues/:league_id/seed-values without auth", async () => {
      const response = await request(app)
        .post("/api/v1/seasons/1/fantasy/leagues/1/seed-values")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });
  });

  describe("Public Routes (No Authentication Required)", () => {
    it("should allow GET /:season_id/fantasy/leagues/:league_id/players without auth", async () => {
      const response = await request(app).get(
        "/api/v1/seasons/1/fantasy/leagues/1/players"
      );

      // Should not return 401 - might return 400, 404, or 200 depending on implementation
      expect(response.status).not.toBe(401);
    });

    it("should allow GET /:season_id/fantasy/leagues/:league_id/leaderboard without auth", async () => {
      const response = await request(app).get(
        "/api/v1/seasons/1/fantasy/leagues/1/leaderboard"
      );

      // Should not return 401
      expect(response.status).not.toBe(401);
      expect(response.status).toBe(200); // Mocked controller returns 200
    });

    it("should allow GET /:season_id/fantasy/overall-leaderboard without auth", async () => {
      const response = await request(app).get(
        "/api/v1/seasons/1/fantasy/overall-leaderboard"
      );

      // Should not return 401
      expect(response.status).not.toBe(401);
      expect(response.status).toBe(200); // Mocked controller returns 200
    });

    it("should allow GET /:season_id/fantasy/leagues/:league_id/price-history without auth", async () => {
      const response = await request(app).get(
        "/api/v1/seasons/1/fantasy/leagues/1/price-history"
      );

      // Should not return 401
      expect(response.status).not.toBe(401);
      expect(response.status).toBe(200); // Mocked controller returns 200
    });

    it("should allow GET /:season_id/fantasy/leagues/:league_id/top-players without auth", async () => {
      const response = await request(app).get(
        "/api/v1/seasons/1/fantasy/leagues/1/top-players"
      );

      // Should not return 401
      expect(response.status).not.toBe(401);
      expect(response.status).toBe(200); // Mocked controller returns 200
    });
  });

  describe("Authenticated Access", () => {
    beforeEach(() => {
      mockGetPermissionsForAccountId.mockResolvedValue([]);
      mockGetRolesForAccountId.mockResolvedValue([]);
    });

    it("should allow POST /:season_id/fantasy/teams with authentication", async () => {
      const response = await request(app)
        .post("/api/v1/seasons/1/fantasy/teams")
        .set("Authorization", "Bearer valid-token")
        .send({ league_id: 1, players: [] });

      // Should not return 401 - might return 400 or other status depending on validation
      expect(response.status).not.toBe(401);
    });

    it("should allow GET /:season_id/fantasy/teams/me with authentication", async () => {
      const response = await request(app)
        .get("/api/v1/seasons/1/fantasy/teams/me")
        .set("Authorization", "Bearer valid-token");

      // Should not return 401 - might return 404 or 200 depending on team existence
      expect(response.status).not.toBe(401);
    });

    it("should allow PUT /:season_id/fantasy/teams/me/players with authentication", async () => {
      const response = await request(app)
        .put("/api/v1/seasons/1/fantasy/teams/me/players")
        .set("Authorization", "Bearer valid-token")
        .send({});

      // Should not return 401
      expect(response.status).not.toBe(401);
    });

    it("should allow PUT /:season_id/fantasy/teams/me/roles with authentication", async () => {
      const response = await request(app)
        .put("/api/v1/seasons/1/fantasy/teams/me/roles")
        .set("Authorization", "Bearer valid-token")
        .send({});

      // Should not return 401
      expect(response.status).not.toBe(401);
    });

    it("should allow GET /:season_id/fantasy/teams/me/players/:player_id/points with authentication", async () => {
      const response = await request(app)
        .get("/api/v1/seasons/1/fantasy/teams/me/players/12345/points")
        .set("Authorization", "Bearer valid-token");

      // Should not return 401
      expect(response.status).not.toBe(401);
    });

    it("should allow POST /:season_id/fantasy/leagues/:league_id/seed-values with authentication", async () => {
      const response = await request(app)
        .post("/api/v1/seasons/1/fantasy/leagues/1/seed-values")
        .set("Authorization", "Bearer valid-token");

      // Should not return 401
      expect(response.status).not.toBe(401);
    });
  });
});
