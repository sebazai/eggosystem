import request from "supertest";
import express from "express";
import { runQuery } from "../../db/mysqlRunQuery";
import {
  getAllTeamCaptainsController,
  getTeamCaptainsBySeasonIdController,
  getTeamCaptainsForActiveSeasonController
} from "../../controllers/team-captains.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

// Mock the database
jest.mock("../../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

// Mock the logger
jest.mock("../../utils/app-logger");

// Create a test app with just the routes we want to test
const createTestApp = (userRoles: string[] = ["admin"]) => {
  const app = express();

  // Mock authentication middleware
  const mockAuthMiddleware = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (req.headers.authorization === "Bearer valid_token") {
      req.auth = {
        account_id: 1,
        provider_id: "123",
        permissions: [],
        roles: userRoles,
        nickname: "TestUser",
        provider: "steam"
      };
    }
    next();
  };

  const mockPermissionMiddleware =
    (requiredRoles: string[]) =>
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (
        req.auth &&
        req.auth.roles &&
        requiredRoles.some((role) => req.auth!.roles.includes(role))
      ) {
        next();
      } else {
        next({ status: 403, message: "Forbidden: Insufficient permissions" });
      }
    };

  // Add the routes we want to test
  app.get(
    "/captains",
    mockAuthMiddleware,
    mockPermissionMiddleware(["admin", "captain", "helpdesk"]),
    getAllTeamCaptainsController
  );
  app.get(
    "/season/active/captains",
    mockAuthMiddleware,
    mockPermissionMiddleware(["admin", "captain", "helpdesk"]),
    getTeamCaptainsForActiveSeasonController
  );
  app.get(
    "/season/:season_id/captains",
    mockAuthMiddleware,
    mockPermissionMiddleware(["admin", "captain", "helpdesk"]),
    validateNumericParams(["season_id"]),
    getTeamCaptainsBySeasonIdController
  );

  // Add error handler
  app.use(
    (
      err: { status?: number; detail?: string; message?: string },
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (err.status) {
        res.status(err.status).json({
          type: "about:blank",
          title: err.status === 403 ? "Forbidden" : "Bad Request",
          status: err.status,
          detail: err.message
        });
      } else if (err.detail && err.detail.includes("Invalid numeric param")) {
        // Handle validation errors
        res.status(400).json({
          type: "about:blank",
          title: "Bad Request",
          status: 400,
          detail: err.detail
        });
      } else {
        res.status(500).json({
          type: "about:blank",
          title: "Internal Server Error",
          status: 500,
          detail: "An unexpected error occurred"
        });
      }
    }
  );

  return app;
};

// Create a test app for unauthenticated requests
const createUnauthenticatedTestApp = () => {
  const app = express();

  // Mock authentication middleware that doesn't set auth for missing tokens
  const mockAuthMiddleware = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // Only set auth if token is present
    if (req.headers.authorization === "Bearer valid_token") {
      req.auth = {
        account_id: 1,
        provider_id: "123",
        permissions: [],
        roles: ["admin"],
        nickname: "TestUser",
        provider: "steam"
      };
    }
    next();
  };

  const mockPermissionMiddleware =
    (requiredRoles: string[]) =>
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (
        req.auth &&
        req.auth.roles &&
        requiredRoles.some((role) => req.auth!.roles.includes(role))
      ) {
        next();
      } else {
        next({ status: 401, message: "Unauthorized: Authentication required" });
      }
    };

  // Add the routes we want to test
  app.get(
    "/captains",
    mockAuthMiddleware,
    mockPermissionMiddleware(["admin", "captain", "helpdesk"]),
    getAllTeamCaptainsController
  );
  app.get(
    "/season/active/captains",
    mockAuthMiddleware,
    mockPermissionMiddleware(["admin", "captain", "helpdesk"]),
    getTeamCaptainsForActiveSeasonController
  );
  app.get(
    "/season/:season_id/captains",
    mockAuthMiddleware,
    mockPermissionMiddleware(["admin", "captain", "helpdesk"]),
    validateNumericParams(["season_id"]),
    getTeamCaptainsBySeasonIdController
  );

  // Add error handler
  app.use(
    (
      err: { status?: number; message?: string },
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (err.status) {
        res.status(err.status).json({
          type: "about:blank",
          title:
            err.status === 401
              ? "Unauthorized"
              : err.status === 403
                ? "Forbidden"
                : "Bad Request",
          status: err.status,
          detail: err.message
        });
      } else {
        res.status(500).json({
          type: "about:blank",
          title: "Internal Server Error",
          status: 500,
          detail: "An unexpected error occurred"
        });
      }
    }
  );

  return app;
};

describe("Team Routes - Captains Endpoints", () => {
  let testApp: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    testApp = createTestApp();
  });

  describe("GET /captains", () => {
    it("should return 401 without authentication", async () => {
      const unauthenticatedApp = createUnauthenticatedTestApp();
      const response = await request(unauthenticatedApp)
        .get("/captains")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401
      });
    });

    it("should return 403 for users without required roles", async () => {
      const playerApp = createTestApp(["player"]); // Only player role, not admin/captain/helpdesk

      const response = await request(playerApp)
        .get("/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403
      });
    });

    it("should return 403 for users with only 'moderator' role", async () => {
      const moderatorApp = createTestApp(["moderator"]); // Not in required roles

      const response = await request(moderatorApp)
        .get("/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403
      });
    });

    it("should return team captains for users with admin role", async () => {
      const adminApp = createTestApp(["admin"]);

      const mockCaptains = [
        {
          team_id: 1650,
          team_name: "Team Alpha",
          captain_discord: "enzoj#1234",
          co_captain_discord: "co1#5678"
        },
        {
          team_id: 1651,
          team_name: "Team Beta",
          captain_discord: "captain2#1234",
          co_captain_discord: null
        }
      ];

      mockRunQuery.mockResolvedValue(mockCaptains);

      const response = await request(adminApp)
        .get("/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(200);

      expect(response.body).toEqual(mockCaptains);
      expect(mockRunQuery).toHaveBeenCalled();
    });

    it("should return team captains for users with captain role", async () => {
      const captainApp = createTestApp(["captain"]);

      const mockCaptains = [
        {
          team_id: 1650,
          team_name: "Team Alpha",
          captain_discord: "enzoj#1234",
          co_captain_discord: null
        }
      ];

      mockRunQuery.mockResolvedValue(mockCaptains);

      const response = await request(captainApp)
        .get("/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(200);

      expect(response.body).toEqual(mockCaptains);
    });

    it("should return team captains for users with helpdesk role", async () => {
      const helpdeskApp = createTestApp(["helpdesk"]);

      const mockCaptains = [
        {
          team_id: 1650,
          team_name: "Team Alpha",
          captain_discord: "enzoj#1234",
          co_captain_discord: null
        }
      ];

      mockRunQuery.mockResolvedValue(mockCaptains);

      const response = await request(helpdeskApp)
        .get("/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(200);

      expect(response.body).toEqual(mockCaptains);
    });
  });

  describe("GET /season/active/captains", () => {
    it("should return 401 without authentication", async () => {
      const unauthenticatedApp = createUnauthenticatedTestApp();
      const response = await request(unauthenticatedApp)
        .get("/season/active/captains")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401
      });
    });

    it("should return 403 for users without required roles", async () => {
      const playerApp = createTestApp(["player"]); // Only player role, not admin/captain/helpdesk

      const response = await request(playerApp)
        .get("/season/active/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403
      });
    });

    it("should return active season captains for users with required roles", async () => {
      const mockCaptains = [
        {
          team_id: 1650,
          team_name: "Team Alpha",
          captain_discord: "enzoj#1234",
          co_captain_discord: "co1#5678"
        }
      ];

      // Mock the active season query
      mockRunQuery
        .mockResolvedValueOnce([{ season_id: 14 }]) // Active season query
        .mockResolvedValueOnce(mockCaptains); // Captains query

      const response = await request(testApp)
        .get("/season/active/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(200);

      expect(response.body).toEqual(mockCaptains);
    });

    it("should handle custom app_id and organizer_id query parameters", async () => {
      const mockCaptains = [
        {
          team_id: 1650,
          team_name: "Team Alpha",
          captain_discord: "enzoj#1234",
          co_captain_discord: null
        }
      ];

      mockRunQuery
        .mockResolvedValueOnce([{ season_id: 15 }]) // Active season query
        .mockResolvedValueOnce(mockCaptains); // Captains query

      const response = await request(testApp)
        .get("/season/active/captains?app_id=730&organizer_id=2")
        .set("Authorization", "Bearer valid_token")
        .expect(200);

      expect(response.body).toEqual(mockCaptains);
    });
  });

  describe("GET /season/:season_id/captains", () => {
    it("should return 401 without authentication", async () => {
      const unauthenticatedApp = createUnauthenticatedTestApp();
      const response = await request(unauthenticatedApp)
        .get("/season/14/captains")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401
      });
    });

    it("should return 403 for users without required roles", async () => {
      const playerApp = createTestApp(["player"]); // Only player role, not admin/captain/helpdesk

      const response = await request(playerApp)
        .get("/season/14/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403
      });
    });

    it("should return 400 for invalid season_id", async () => {
      const response = await request(testApp)
        .get("/season/invalid/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid numeric param: season_id"
      });
    });

    it("should return 400 for negative season_id", async () => {
      const response = await request(testApp)
        .get("/season/-1/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Invalid season ID: -1"
      });
    });

    it("should return captains for season 14 with team 1650 captain being enzoj", async () => {
      const mockCaptains = [
        {
          team_id: 1650,
          team_name: "Team Alpha",
          captain_discord: "enzoj#1234",
          co_captain_discord: "co1#5678"
        },
        {
          team_id: 1651,
          team_name: "Team Beta",
          captain_discord: "captain2#1234",
          co_captain_discord: null
        }
      ];

      mockRunQuery.mockResolvedValue(mockCaptains);

      const response = await request(testApp)
        .get("/season/14/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(200);

      expect(response.body).toEqual(mockCaptains);

      // Specific test: team 1650 captain should be enzoj
      const team1650 = response.body.find(
        (captain: {
          team_id: number;
          team_name: string;
          captain_discord: string;
          co_captain_discord: string | null;
        }) => captain.team_id === 1650
      );
      expect(team1650).toBeDefined();
      expect(team1650.team_name).toBe("Team Alpha");
      expect(team1650.captain_discord).toBe("enzoj#1234");

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        [14]
      );
    });

    it("should return empty array for season with no captains", async () => {
      mockRunQuery.mockResolvedValue([]);

      const response = await request(testApp)
        .get("/season/999/captains")
        .set("Authorization", "Bearer valid_token")
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
