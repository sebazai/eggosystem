import request from "supertest";
import express, {
  type Request,
  type Response,
  type NextFunction
} from "express";
import { createExpressTestApp } from "../../../test-utils";
import redisRouter from "./redis.routes";
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../../../services/auth.services";

// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

// Mock the auth services
jest.mock("../../../services/auth.services", () => ({
  getPermissionsForAccountId: jest.fn(),
  getRolesForAccountId: jest.fn()
}));

const mockedGetPermissions = getPermissionsForAccountId as jest.MockedFunction<
  typeof getPermissionsForAccountId
>;

const mockedGetRoles = getRolesForAccountId as jest.MockedFunction<
  typeof getRolesForAccountId
>;

describe("Redis Routes", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Default mock implementations
    mockedGetPermissions.mockResolvedValue([]);
    mockedGetRoles.mockResolvedValue([]);

    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      redisRouter,
      "/api/v1/dashboard/redis"
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /api/v1/dashboard/redis/keys", () => {
    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/v1/dashboard/redis/keys").expect(401);
    });

    it("should return 403 when user lacks required role", async () => {
      // Mock the auth services to return insufficient roles
      mockedGetRoles.mockResolvedValue(["captain"]); // User has captain role, but needs admin or helpdesk
      mockedGetPermissions.mockResolvedValue([]);

      // Mock authentication middleware to return a user without required roles
      const mockAuth = (req: Request, res: Response, next: NextFunction) => {
        req.auth = {
          account_id: 1,
          provider_id: "test",
          permissions: [],
          roles: ["captain"],
          nickname: "test",
          provider: "steam"
        };
        next();
      };

      const customRouter = express.Router();
      customRouter.use(mockAuth);
      customRouter.use(redisRouter);

      const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
        customRouter,
        "/api/v1/dashboard/redis"
      );
      app = testApp;
      cleanup = appCleanup;

      await request(app).get("/api/v1/dashboard/redis/keys").expect(403);
    });
  });

  describe("GET /api/v1/dashboard/redis/keys/:key", () => {
    it("should return 401 when not authenticated", async () => {
      await request(app)
        .get("/api/v1/dashboard/redis/keys/test-key")
        .expect(401);
    });

    it("should return 403 when user lacks required role", async () => {
      // Mock the auth services to return insufficient roles
      mockedGetRoles.mockResolvedValue(["captain"]); // User has captain role, but needs admin or helpdesk
      mockedGetPermissions.mockResolvedValue([]);

      const mockAuth = (req: Request, res: Response, next: NextFunction) => {
        req.auth = {
          account_id: 1,
          provider_id: "test",
          permissions: [],
          roles: ["captain"],
          nickname: "test",
          provider: "steam"
        };
        next();
      };

      const customRouter = express.Router();
      customRouter.use(mockAuth);
      customRouter.use(redisRouter);

      const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
        customRouter,
        "/api/v1/dashboard/redis"
      );
      app = testApp;
      cleanup = appCleanup;

      await request(app)
        .get("/api/v1/dashboard/redis/keys/test-key")
        .expect(403);
    });
  });

  describe("DELETE /api/v1/dashboard/redis/keys/:key", () => {
    it("should return 401 when not authenticated", async () => {
      await request(app)
        .delete("/api/v1/dashboard/redis/keys/test-key")
        .expect(401);
    });

    it("should return 403 when user lacks admin role", async () => {
      // Mock the auth services to return insufficient roles
      mockedGetRoles.mockResolvedValue(["helpdesk"]); // User has helpdesk role, but needs admin for DELETE
      mockedGetPermissions.mockResolvedValue([]);

      const mockAuth = (req: Request, res: Response, next: NextFunction) => {
        req.auth = {
          account_id: 1,
          provider_id: "test",
          permissions: [],
          roles: ["helpdesk"],
          nickname: "test",
          provider: "steam"
        };
        next();
      };

      const customRouter = express.Router();
      customRouter.use(mockAuth);
      customRouter.use(redisRouter);

      const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
        customRouter,
        "/api/v1/dashboard/redis"
      );
      app = testApp;
      cleanup = appCleanup;

      await request(app)
        .delete("/api/v1/dashboard/redis/keys/test-key")
        .expect(403);
    });
  });
});
