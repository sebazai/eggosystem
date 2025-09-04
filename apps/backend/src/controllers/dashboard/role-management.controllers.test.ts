import type { Request, Response, NextFunction } from "express";
import {
  addRole,
  removeRole,
  listUsersWithRole,
  getManageableRoles
} from "./role-management.controllers";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock the database
jest.mock("../../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

// Mock the account-roles models
jest.mock("../../models/account-roles.models", () => ({
  setRoleForAccount: jest.fn(),
  removeRoleForAccount: jest.fn()
}));

import {
  setRoleForAccount,
  removeRoleForAccount
} from "../../models/account-roles.models";
const mockSetRoleForAccount = setRoleForAccount as jest.MockedFunction<
  typeof setRoleForAccount
>;
const mockRemoveRoleForAccount = removeRoleForAccount as jest.MockedFunction<
  typeof removeRoleForAccount
>;

describe("Role Management Controllers", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const createAuthPayload = (roles: string[]) => ({
    account_id: 1,
    provider_id: "76561198000000001",
    permissions: [],
    roles,
    nickname: "TestUser",
    provider: "steam" as const
  });

  beforeEach(() => {
    mockReq = {
      auth: createAuthPayload(["admin"])
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("addRole", () => {
    it("should add caster role for valid steam_id with admin permission", async () => {
      const steamId = "76561198000000001";
      const accountId = 123;
      const nickname = "TestUser";
      const role = "caster";

      mockReq.body = { steam_id: steamId, role };
      mockRunQuery
        .mockResolvedValueOnce([{ account_id: accountId, nickname }]) // getAccountIdFromSteamId
        .mockResolvedValueOnce([]); // checkExistingRole

      await addRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockSetRoleForAccount).toHaveBeenCalledWith(role, accountId);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: `${role} role added successfully`,
        data: { account_id: accountId, nickname, steam_id: steamId, role }
      });
    });

    it("should add caster role for valid steam_id with helpdesk permission", async () => {
      const steamId = "76561198000000002";
      const accountId = 456;
      const nickname = "TestUser2";
      const role = "caster";

      mockReq.auth = createAuthPayload(["helpdesk"]);
      mockReq.body = { steam_id: steamId, role };
      mockRunQuery
        .mockResolvedValueOnce([{ account_id: accountId, nickname }]) // getAccountIdFromSteamId
        .mockResolvedValueOnce([]); // checkExistingRole

      await addRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockSetRoleForAccount).toHaveBeenCalledWith(role, accountId);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: `${role} role added successfully`,
        data: { account_id: accountId, nickname, steam_id: steamId, role }
      });
    });

    it("should throw ForbiddenError when helpdesk tries to add admin role", async () => {
      const steamId = "76561198000000001";
      const role = "admin";

      mockReq.auth = createAuthPayload(["helpdesk"]);
      mockReq.body = { steam_id: steamId, role };

      await addRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You don't have permission to add admin role",
          status: 403
        })
      );
    });

    it("should throw BadRequestError for invalid role", async () => {
      const steamId = "76561198000000001";
      const role = "invalid_role";

      mockReq.body = { steam_id: steamId, role };

      await addRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid role: invalid_role",
          status: 400
        })
      );
    });

    it("should throw NotFoundError for non-existent steam_id", async () => {
      const steamId = "76561198000000001";
      const role = "caster";

      mockReq.body = { steam_id: steamId, role };
      mockRunQuery.mockResolvedValueOnce([]); // getAccountIdFromSteamId returns empty

      await addRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User not found for the provided Steam ID",
          status: 404
        })
      );
    });

    it("should throw BadRequestError if user already has role", async () => {
      const steamId = "76561198000000001";
      const accountId = 123;
      const nickname = "TestUser";
      const role = "caster";

      mockReq.body = { steam_id: steamId, role };
      mockRunQuery
        .mockResolvedValueOnce([{ account_id: accountId, nickname }]) // getAccountIdFromSteamId
        .mockResolvedValueOnce([{ role_id: 1 }]); // checkExistingRole

      await addRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `User already has ${role} role`,
          status: 400
        })
      );
    });
  });

  describe("removeRole", () => {
    it("should remove caster role for valid steam_id with admin permission", async () => {
      const steamId = "76561198000000001";
      const accountId = 123;
      const nickname = "TestUser";
      const role = "caster";

      mockReq.body = { steam_id: steamId, role };
      mockRunQuery
        .mockResolvedValueOnce([{ account_id: accountId, nickname }]) // getAccountIdFromSteamId
        .mockResolvedValueOnce([{ role_id: 1 }]); // checkExistingRole

      await removeRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRemoveRoleForAccount).toHaveBeenCalledWith(role, accountId);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: `${role} role removed successfully`,
        data: { account_id: accountId, nickname, steam_id: steamId, role }
      });
    });

    it("should remove caster role for valid steam_id with helpdesk permission", async () => {
      const steamId = "76561198000000002";
      const accountId = 456;
      const nickname = "TestUser2";
      const role = "caster";

      mockReq.auth = createAuthPayload(["helpdesk"]);
      mockReq.body = { steam_id: steamId, role };
      mockRunQuery
        .mockResolvedValueOnce([{ account_id: accountId, nickname }]) // getAccountIdFromSteamId
        .mockResolvedValueOnce([{ role_id: 1 }]); // checkExistingRole

      await removeRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRemoveRoleForAccount).toHaveBeenCalledWith(role, accountId);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: `${role} role removed successfully`,
        data: { account_id: accountId, nickname, steam_id: steamId, role }
      });
    });

    it("should throw ForbiddenError when helpdesk tries to remove admin role", async () => {
      const steamId = "76561198000000001";
      const role = "admin";

      mockReq.auth = createAuthPayload(["helpdesk"]);
      mockReq.body = { steam_id: steamId, role };

      await removeRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You don't have permission to remove admin role",
          status: 403
        })
      );
    });

    it("should throw BadRequestError if user doesn't have role", async () => {
      const steamId = "76561198000000001";
      const accountId = 123;
      const nickname = "TestUser";
      const role = "caster";

      mockReq.body = { steam_id: steamId, role };
      mockRunQuery
        .mockResolvedValueOnce([{ account_id: accountId, nickname }]) // getAccountIdFromSteamId
        .mockResolvedValueOnce([]); // checkExistingRole returns empty

      await removeRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `User does not have ${role} role`,
          status: 400
        })
      );
    });
  });

  describe("listUsersWithRole", () => {
    it("should return list of users with caster role for admin", async () => {
      const role = "caster";
      const mockUsers = [
        { account_id: 123, nickname: "Caster1", steam_id: "76561198000000001" },
        { account_id: 456, nickname: "Caster2", steam_id: "76561198000000002" }
      ];

      mockReq.params = { role };
      mockRunQuery.mockResolvedValueOnce(mockUsers);

      await listUsersWithRole(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringMatching(
          /SELECT.*ar\.account_id.*sp\.nickname.*la\.provider_id as steam_id/s
        ),
        [role]
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers
      });
    });

    it("should throw ForbiddenError when helpdesk tries to list admin users", async () => {
      const role = "admin";

      mockReq.auth = createAuthPayload(["helpdesk"]);
      mockReq.params = { role };

      await listUsersWithRole(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You don't have permission to view admin role users",
          status: 403
        })
      );
    });

    it("should throw BadRequestError for invalid role", async () => {
      const role = "invalid_role";

      mockReq.params = { role };

      await listUsersWithRole(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid role: invalid_role",
          status: 400
        })
      );
    });
  });

  describe("getManageableRoles", () => {
    it("should return manageable roles for superadmin", async () => {
      mockReq.auth = createAuthPayload(["superadmin"]);

      await getManageableRoles(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: ["admin", "helpdesk", "caster", "captain"]
      });
    });

    it("should return manageable roles for admin", async () => {
      mockReq.auth = createAuthPayload(["admin"]);

      await getManageableRoles(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: ["helpdesk", "caster", "captain"]
      });
    });

    it("should return manageable roles for helpdesk", async () => {
      mockReq.auth = createAuthPayload(["helpdesk"]);

      await getManageableRoles(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: ["caster", "captain"]
      });
    });

    it("should return empty array for caster", async () => {
      mockReq.auth = createAuthPayload(["caster"]);

      await getManageableRoles(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });

    it("should return empty array for captain", async () => {
      mockReq.auth = createAuthPayload(["captain"]);

      await getManageableRoles(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });
  });
});
