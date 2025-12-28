import request from "supertest";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import roleManagementRoutes from "./role-management.routes";
import { expressErrorHandler } from "../../../middlewares/express-error-handler";

// Mock the controllers
jest.mock("../../../controllers/dashboard/role-management.controllers", () => ({
  addRole: jest.fn(),
  removeRole: jest.fn(),
  listUsersWithRole: jest.fn(),
  getManageableRoles: jest.fn(),
  checkExistingCaptain: jest.fn()
}));

// Mock the auth middleware
jest.mock("../../../middlewares/auth.middleware", () => ({
  checkPermissions: () => (req: Request, res: Response, next: NextFunction) =>
    next()
}));

import {
  addRole,
  removeRole,
  listUsersWithRole,
  getManageableRoles
} from "../../../controllers/dashboard/role-management.controllers";

const mockAddRole = addRole as jest.MockedFunction<typeof addRole>;
const mockRemoveRole = removeRole as jest.MockedFunction<typeof removeRole>;
const mockListUsersWithRole = listUsersWithRole as jest.MockedFunction<
  typeof listUsersWithRole
>;
const mockGetManageableRoles = getManageableRoles as jest.MockedFunction<
  typeof getManageableRoles
>;

const app = express();
app.use(express.json());
app.use("/api/v1/dashboard/role-management", roleManagementRoutes);
app.use(expressErrorHandler);

describe("Role Management Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/dashboard/role-management/manageable-roles", () => {
    it("should call getManageableRoles controller", async () => {
      const mockResponse = {
        success: true,
        data: ["helpdesk", "caster", "player"]
      };

      mockGetManageableRoles.mockImplementation(async (req, res) => {
        res.json(mockResponse);
      });

      const response = await request(app)
        .get("/api/v1/dashboard/role-management/manageable-roles")
        .expect(200);

      expect(mockGetManageableRoles).toHaveBeenCalled();
      expect(response.body).toEqual(mockResponse);
    });
  });

  describe("GET /api/v1/dashboard/role-management/:role", () => {
    it("should call listUsersWithRole controller with role parameter", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            account_id: 123,
            nickname: "Caster1",
            steam_id: "76561198000000001"
          }
        ]
      };

      mockListUsersWithRole.mockImplementation(async (req, res) => {
        res.json(mockResponse);
      });

      const response = await request(app)
        .get("/api/v1/dashboard/role-management/caster")
        .expect(200);

      expect(mockListUsersWithRole).toHaveBeenCalled();
      expect(response.body).toEqual(mockResponse);
    });
  });

  describe("POST /api/v1/dashboard/role-management", () => {
    it("should call addRole controller with steam_id and role", async () => {
      const mockResponse = {
        success: true,
        message: "caster role added successfully",
        data: {
          account_id: 123,
          nickname: "TestUser",
          steam_id: "76561198000000001",
          role: "caster"
        }
      };

      mockAddRole.mockImplementation(async (req, res) => {
        res.json(mockResponse);
      });

      const response = await request(app)
        .post("/api/v1/dashboard/role-management")
        .send({ steam_id: "76561198000000001", role: "caster" })
        .expect(200);

      expect(mockAddRole).toHaveBeenCalled();
      expect(response.body).toEqual(mockResponse);
    });

    it("should handle validation errors", async () => {
      mockAddRole.mockImplementation(async (req, res, next) => {
        const error = new Error("Steam ID is required");
        (error as Error & { status?: number }).status = 400;
        next(error);
      });

      const response = await request(app)
        .post("/api/v1/dashboard/role-management")
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Steam ID is required"
      });
    });

    it("should handle permission errors", async () => {
      mockAddRole.mockImplementation(async (req, res, next) => {
        const error = new Error("You don't have permission to add admin role");
        (error as Error & { status?: number }).status = 403;
        next(error);
      });

      const response = await request(app)
        .post("/api/v1/dashboard/role-management")
        .send({ steam_id: "76561198000000001", role: "admin" })
        .expect(403);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Forbidden",
        status: 403,
        detail: "You don't have permission to add admin role"
      });
    });
  });

  describe("DELETE /api/v1/dashboard/role-management", () => {
    it("should call removeRole controller with steam_id and role", async () => {
      const mockResponse = {
        success: true,
        message: "caster role removed successfully",
        data: {
          account_id: 123,
          nickname: "TestUser",
          steam_id: "76561198000000001",
          role: "caster"
        }
      };

      mockRemoveRole.mockImplementation(async (req, res) => {
        res.json(mockResponse);
      });

      const response = await request(app)
        .delete("/api/v1/dashboard/role-management")
        .send({ steam_id: "76561198000000001", role: "caster" })
        .expect(200);

      expect(mockRemoveRole).toHaveBeenCalled();
      expect(response.body).toEqual(mockResponse);
    });

    it("should handle not found errors", async () => {
      mockRemoveRole.mockImplementation(async (req, res, next) => {
        const error = new Error("User not found for the provided Steam ID");
        (error as Error & { status?: number }).status = 404;
        next(error);
      });

      const response = await request(app)
        .delete("/api/v1/dashboard/role-management")
        .send({ steam_id: "76561198000000001", role: "caster" })
        .expect(404);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "User not found for the provided Steam ID"
      });
    });
  });
});
