import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../../test-utils";
import dashboardRouter from "./index";

// Mock all the authentication and permission middleware to allow access
jest.mock("../../../middlewares/auth.middleware", () => ({
  authenticateJWT: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    req.auth = {
      account_id: 1,
      provider: "steam" as const,
      provider_id: "76561198028510846",
      permissions: [],
      roles: ["admin"],
      nickname: "Test User",
      jti: "test-jti"
    };
    next();
  },
  checkPermissions:
    () =>
    (req: express.Request, res: express.Response, next: express.NextFunction) =>
      next()
}));

describe("GET /api/v1/dashboard/sortter/season/:season_id/team/:team_id/live-playervalues", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const customRouter = express.Router();
    customRouter.use(dashboardRouter);

    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      customRouter,
      "/api/v1/dashboard"
    );
    app = testApp;
    cleanup = appCleanup;

    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should return live player values for a team", async () => {
    // Use season 14, team 2021 from the sortter test data
    const response = await request(app).get(
      "/api/v1/dashboard/sortter/season/14/team/2021/live-playervalues"
    );

    if (response.status !== 200) {
      console.log("Error response:", response.body);
    }

    expect(response.status).toBe(200);

    expect(Array.isArray(response.body)).toBe(true);

    // If there are players, check they have the expected fields
    if (response.body.length > 0) {
      const player = response.body[0];
      expect(player).toHaveProperty("name");
      expect(player).toHaveProperty("steamid");
      expect(player).toHaveProperty("kana_elo");
      expect(player).toHaveProperty("role");
      expect(player).toHaveProperty("is_captain");
      expect(player).toHaveProperty("is_co_captain");
      expect(player).toHaveProperty("match_id");
      expect(player).toHaveProperty("match_info");

      // Role should be either 'primary' or 'substitute'
      expect(["primary", "substitute"]).toContain(player.role);

      // Boolean fields
      expect(typeof player.is_captain).toBe("boolean");
      expect(typeof player.is_co_captain).toBe("boolean");

      // match_id should be either a number or null
      expect(
        player.match_id === null || typeof player.match_id === "number"
      ).toBe(true);

      // match_info should be either a string or null
      expect(
        player.match_info === null || typeof player.match_info === "string"
      ).toBe(true);
    }
  });

  it("should return 404 for non-existent team", async () => {
    const response = await request(app)
      .get("/api/v1/dashboard/sortter/season/14/team/99999/live-playervalues")
      .expect(404);

    expect(response.body).toMatchObject({
      type: "about:blank",
      title: "Not Found",
      status: 404,
      detail: "No players found for team 99999 in season 14",
      instance:
        "/api/v1/dashboard/sortter/season/14/team/99999/live-playervalues"
    });
  });

  it("should return 400 for invalid season_id", async () => {
    const response = await request(app)
      .get(
        "/api/v1/dashboard/sortter/season/invalid/team/2021/live-playervalues"
      )
      .expect(400);

    expect(response.body).toMatchObject({
      type: "about:blank",
      title: "Bad Request",
      status: 400,
      instance:
        "/api/v1/dashboard/sortter/season/invalid/team/2021/live-playervalues"
    });
  });

  it("should order primary players before substitutes", async () => {
    const response = await request(app)
      .get("/api/v1/dashboard/sortter/season/14/team/2021/live-playervalues")
      .expect(200);

    if (response.body.length > 1) {
      // Check that all primary players come before all substitutes
      let foundSubstitute = false;
      for (const player of response.body) {
        if (player.role === "substitute") {
          foundSubstitute = true;
        } else if (player.role === "primary" && foundSubstitute) {
          // Found a primary player after a substitute - ordering is wrong
          fail("Primary players should come before substitutes");
        }
      }
    }
  });

  it("should order players by kana_elo within each role group", async () => {
    const response = await request(app)
      .get("/api/v1/dashboard/sortter/season/14/team/2021/live-playervalues")
      .expect(200);

    if (response.body.length > 1) {
      // Check primary players are ordered by kana_elo DESC
      const primaryPlayers = response.body.filter(
        (p: { role: string }) => p.role === "primary"
      );
      for (let i = 1; i < primaryPlayers.length; i++) {
        expect(primaryPlayers[i - 1].kana_elo).toBeGreaterThanOrEqual(
          primaryPlayers[i].kana_elo
        );
      }

      // Check substitute players are ordered by kana_elo DESC
      const substitutePlayers = response.body.filter(
        (p: { role: string }) => p.role === "substitute"
      );
      for (let i = 1; i < substitutePlayers.length; i++) {
        expect(substitutePlayers[i - 1].kana_elo).toBeGreaterThanOrEqual(
          substitutePlayers[i].kana_elo
        );
      }
    }
  });
});
