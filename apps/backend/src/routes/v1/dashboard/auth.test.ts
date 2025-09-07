// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.BACKEND_SERVICE_API_KEY = "test-api-key";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../../test-utils";
import dashboardRouter from "./index";
import { authenticateJWT } from "../../../middlewares/auth.middleware";

// Mock the auth services
jest.mock("../../../services/auth.services");
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../../../services/auth.services";

const mockGetPermissionsForAccountId =
  getPermissionsForAccountId as jest.MockedFunction<
    typeof getPermissionsForAccountId
  >;
const mockGetRolesForAccountId = getRolesForAccountId as jest.MockedFunction<
  typeof getRolesForAccountId
>;

// Mock JWT authentication
jest.mock("../../../middlewares/auth.middleware", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authenticateJWT: (req: any, res: any, next: any) => {
    // Check if Authorization header is present
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No authentication - let checkPermissions handle the error
      return next();
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
  checkPermissions: jest.requireActual("../../../middlewares/auth.middleware")
    .checkPermissions
}));

describe("Dashboard Routes Authentication Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    // Create a custom router that includes JWT authentication middleware
    const customRouter = express.Router();
    customRouter.use(authenticateJWT);
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

  describe("Unauthenticated Access", () => {
    it("should return 401 for dashboard root without authentication", async () => {
      const response = await request(app).get("/api/v1/dashboard/").expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for seasons routes without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/seasons")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for players routes without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/players")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for teams routes without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/teams")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for organizations routes without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/organizations")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for registration routes without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/registration")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for sortter routes without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/sortter")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for matches routes without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/matches")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });

    it("should return 401 for role-management routes without authentication", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/role-management")
        .expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });
  });

  describe("Authenticated but Insufficient Permissions", () => {
    beforeEach(() => {
      // Mock authenticated user with no permissions/roles
      mockGetPermissionsForAccountId.mockResolvedValue([]);
      mockGetRolesForAccountId.mockResolvedValue([]);
    });

    it("should return 403 for dashboard root with no permissions", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/")
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Forbidden: Insufficient permissions"
      });
    });

    it("should return 403 for seasons routes with no admin/helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/seasons")
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Forbidden: Insufficient permissions"
      });
    });

    it("should return 403 for players routes with no admin/helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/players")
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Forbidden: Insufficient permissions"
      });
    });

    it("should return 403 for teams routes with no admin/helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/teams")
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Forbidden: Insufficient permissions"
      });
    });

    it("should return 403 for organizations routes with no admin/helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/organizations")
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Forbidden: Insufficient permissions"
      });
    });

    it("should return 403 for registration routes with no admin/helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/registration")
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Forbidden: Insufficient permissions"
      });
    });

    it("should return 403 for sortter routes with no admin role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/sortter")
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Forbidden: Insufficient permissions"
      });
    });

    it("should return 403 for matches routes with no admin/helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/matches")
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Forbidden: Insufficient permissions"
      });
    });

    it("should return 403 for role-management routes with no admin/helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/role-management")
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Forbidden: Insufficient permissions"
      });
    });
  });

  describe("Authenticated with Admin Role", () => {
    beforeEach(() => {
      // Mock authenticated user with admin role
      mockGetPermissionsForAccountId.mockResolvedValue([]);
      mockGetRolesForAccountId.mockResolvedValue(["admin"]);
    });

    it("should allow access to dashboard root with admin role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toEqual({ OK: 200 });
    });

    it("should allow access to seasons routes with admin role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/seasons")
        .set("Authorization", "Bearer valid-token");

      // Should not return 403 - might return 404 or other status depending on route implementation
      expect(response.status).not.toBe(403);
    });

    it("should allow access to players routes with admin role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/players")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should allow access to teams routes with admin role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/teams")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should allow access to organizations routes with admin role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/organizations")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should allow access to registration routes with admin role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/registration")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should allow access to sortter routes with admin role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/sortter")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should allow access to matches routes with admin role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/matches")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should allow access to role-management routes with admin role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/role-management")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });
  });

  describe("Authenticated with Helpdesk Role", () => {
    beforeEach(() => {
      // Mock authenticated user with helpdesk role
      mockGetPermissionsForAccountId.mockResolvedValue([]);
      mockGetRolesForAccountId.mockResolvedValue(["helpdesk"]);
    });

    it("should deny access to dashboard root with helpdesk role (requires admin)", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/")
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Forbidden: Insufficient permissions"
      });
    });

    it("should allow access to seasons routes with helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/seasons")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should allow access to players routes with helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/players")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should allow access to teams routes with helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/teams")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should allow access to organizations routes with helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/organizations")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should allow access to registration routes with helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/registration")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should deny access to sortter routes with helpdesk role (requires admin)", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/sortter")
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "Forbidden: Insufficient permissions"
      });
    });

    it("should allow access to matches routes with helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/matches")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });

    it("should allow access to role-management routes with helpdesk role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/role-management")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).not.toBe(403);
    });
  });

  describe("Authenticated with Static Permission", () => {
    beforeEach(() => {
      // Mock authenticated user with read:dashboard permission
      mockGetPermissionsForAccountId.mockResolvedValue(["read:dashboard"]);
      mockGetRolesForAccountId.mockResolvedValue([]);
    });

    it("should allow access to dashboard root with read:dashboard permission", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toEqual({ OK: 200 });
    });
  });

  // Note: Dashboard routes use authenticateJWT directly, not checkApiKeyOrJWT
  // So API key authentication is not supported for dashboard routes
});
