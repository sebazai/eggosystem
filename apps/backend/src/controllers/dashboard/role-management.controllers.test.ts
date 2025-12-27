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

// Mock the database connection
jest.mock("../../db/mysqlConnection");
import { getConnection } from "../../db/mysqlConnection";
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;

// Mock the account-roles models
jest.mock("../../models/account-roles.models", () => ({
  setRoleForAccount: jest.fn(),
  removeRoleForAccount: jest.fn(),
  userHasRole: jest.fn()
}));

import {
  setRoleForAccount,
  removeRoleForAccount,
  userHasRole
} from "../../models/account-roles.models";
const mockSetRoleForAccount = setRoleForAccount as jest.MockedFunction<
  typeof setRoleForAccount
>;
const mockRemoveRoleForAccount = removeRoleForAccount as jest.MockedFunction<
  typeof removeRoleForAccount
>;
const mockUserHasRole = userHasRole as jest.MockedFunction<typeof userHasRole>;

// Mock the account models
jest.mock("../../models/account.models", () => ({
  getUserInfoBySteamId: jest.fn()
}));

import { getUserInfoBySteamId } from "../../models/account.models";
const mockGetUserInfoBySteamId = getUserInfoBySteamId as jest.MockedFunction<
  typeof getUserInfoBySteamId
>;

// Mock the season-team-players models
jest.mock("../../models/season-team-players.models", () => ({
  playerExistsInSeasonTeam: jest.fn()
}));

import { playerExistsInSeasonTeam } from "../../models/season-team-players.models";
import { type PoolConnection } from "mysql2/promise";
const mockPlayerExistsInSeasonTeam =
  playerExistsInSeasonTeam as jest.MockedFunction<
    typeof playerExistsInSeasonTeam
  >;

// Create mock connection object
const mockConnection = {
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn()
};

// Mock creator functions for common test scenarios
const mockHelpers = {
  /**
   * Mock successful user info lookup
   */
  mockUserInfoExists: (accountId: number, nickname: string) => {
    mockGetUserInfoBySteamId.mockResolvedValueOnce({
      account_id: accountId,
      nickname
    });
  },

  /**
   * Mock user not found
   */
  mockUserInfoNotFound: () => {
    mockGetUserInfoBySteamId.mockResolvedValueOnce(null);
  },

  /**
   * Mock user has a specific role
   */
  mockUserHasRoleTrue: () => {
    mockUserHasRole.mockResolvedValueOnce(true);
  },

  /**
   * Mock user doesn't have a specific role
   */
  mockUserHasRoleFalse: () => {
    mockUserHasRole.mockResolvedValueOnce(false);
  },

  /**
   * Mock player exists in SeasonTeamPlayers
   */
  mockPlayerInTeam: () => {
    mockPlayerExistsInSeasonTeam.mockResolvedValueOnce(true);
  },

  /**
   * Mock player doesn't exist in SeasonTeamPlayers
   */
  mockPlayerNotInTeam: () => {
    mockPlayerExistsInSeasonTeam.mockResolvedValueOnce(false);
  },

  /**
   * Mock successful captain/co-captain updates (remove old, set new)
   */
  mockCaptainUpdates: () => {
    mockRunQuery
      .mockResolvedValueOnce(undefined) // UPDATE remove old captain/co-captain
      .mockResolvedValueOnce(undefined); // UPDATE set new captain/co-captain
  },

  /**
   * Mock complete successful role assignment flow
   */
  mockSuccessfulRoleAssignment: (accountId: number, nickname: string) => {
    mockHelpers.mockUserInfoExists(accountId, nickname);
    mockHelpers.mockUserHasRoleFalse();
  },

  /**
   * Mock complete successful captain assignment flow
   */
  mockSuccessfulCaptainAssignment: (accountId: number, nickname: string) => {
    mockHelpers.mockUserInfoExists(accountId, nickname);
    mockHelpers.mockPlayerInTeam();
    mockHelpers.mockCaptainUpdates();
    mockHelpers.mockUserHasRoleFalse();
  },

  /**
   * Mock user already has role for team context
   */
  mockUserAlreadyHasRoleWithTeamContext: (
    accountId: number,
    nickname: string
  ) => {
    mockHelpers.mockUserInfoExists(accountId, nickname);
    mockHelpers.mockPlayerInTeam();
    mockHelpers.mockCaptainUpdates();
    mockHelpers.mockUserHasRoleTrue();
  }
};

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

    // Reset mock connection
    mockConnection.beginTransaction.mockClear();
    mockConnection.commit.mockClear();
    mockConnection.rollback.mockClear();
    mockConnection.release.mockClear();
    mockGetConnection.mockResolvedValue(
      mockConnection as unknown as PoolConnection
    );
  });

  describe("addRole", () => {
    it("should add caster role for valid steam_id with admin permission", async () => {
      const steamId = "76561198000000001";
      const accountId = 123;
      const nickname = "TestUser";
      const role = "caster";

      mockReq.body = { steam_id: steamId, role };
      mockHelpers.mockSuccessfulRoleAssignment(accountId, nickname);

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
      mockHelpers.mockSuccessfulRoleAssignment(accountId, nickname);

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
      mockHelpers.mockUserInfoNotFound();

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
      mockHelpers.mockUserInfoExists(accountId, nickname);
      mockHelpers.mockUserHasRoleTrue();

      await addRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `User already has ${role} role`,
          status: 400
        })
      );
    });

    describe("captain/co-captain with season and team context", () => {
      it("should assign captain role to a player in SeasonTeamPlayers and replace old captain", async () => {
        const steamId = "76561198000000002";
        const accountId = 123;
        const nickname = "NewCaptain";
        const role = "captain";
        const seasonId = 10;
        const teamId = 5;

        mockReq.body = {
          steam_id: steamId,
          role,
          season_id: seasonId,
          team_id: teamId
        };

        mockHelpers.mockSuccessfulCaptainAssignment(accountId, nickname);

        await addRole(mockReq as Request, mockRes as Response, mockNext);

        // Verify transaction was used
        expect(mockGetConnection).toHaveBeenCalled();
        expect(mockConnection.beginTransaction).toHaveBeenCalled();
        expect(mockConnection.commit).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();

        // Verify player existence was checked
        expect(mockPlayerExistsInSeasonTeam).toHaveBeenCalledWith(
          steamId,
          seasonId,
          teamId,
          mockConnection
        );

        // Verify old captain flag was removed (with connection)
        expect(mockRunQuery).toHaveBeenNthCalledWith(
          1,
          expect.stringContaining(
            "UPDATE SeasonTeamPlayers SET is_captain = 0"
          ),
          [seasonId, teamId],
          mockConnection
        );

        // Verify new captain flag was set (with connection)
        expect(mockRunQuery).toHaveBeenNthCalledWith(
          2,
          expect.stringContaining(
            "UPDATE SeasonTeamPlayers SET is_captain = 1"
          ),
          [seasonId, teamId, steamId],
          mockConnection
        );

        // Verify role check was called
        expect(mockUserHasRole).toHaveBeenCalledWith(
          accountId,
          role,
          mockConnection
        );

        // Verify global role was added (with connection)
        expect(mockSetRoleForAccount).toHaveBeenCalledWith(
          role,
          accountId,
          mockConnection
        );

        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: `${role} role added and assigned to team successfully`,
          data: { account_id: accountId, nickname, steam_id: steamId, role }
        });
      });

      it("should assign co-captain role to a player in SeasonTeamPlayers", async () => {
        const steamId = "76561198000000003";
        const accountId = 456;
        const nickname = "NewCoCaptain";
        const role = "co-captain";
        const seasonId = 10;
        const teamId = 5;

        mockReq.body = {
          steam_id: steamId,
          role,
          season_id: seasonId,
          team_id: teamId
        };

        mockHelpers.mockSuccessfulCaptainAssignment(accountId, nickname);

        await addRole(mockReq as Request, mockRes as Response, mockNext);

        // Verify old co-captain flag was removed (with connection)
        expect(mockRunQuery).toHaveBeenNthCalledWith(
          1,
          expect.stringContaining(
            "UPDATE SeasonTeamPlayers SET is_co_captain = 0"
          ),
          [seasonId, teamId],
          mockConnection
        );

        // Verify new co-captain flag was set (with connection)
        expect(mockRunQuery).toHaveBeenNthCalledWith(
          2,
          expect.stringContaining(
            "UPDATE SeasonTeamPlayers SET is_co_captain = 1"
          ),
          [seasonId, teamId, steamId],
          mockConnection
        );

        // Both captain and co-captain use the 'captain' role in AccountRoles
        expect(mockSetRoleForAccount).toHaveBeenCalledWith(
          "captain",
          accountId,
          mockConnection
        );
      });

      it("should throw BadRequestError if player not in SeasonTeamPlayers", async () => {
        const steamId = "76561198000000004";
        const accountId = 789;
        const nickname = "NonExistentPlayer";
        const role = "captain";
        const seasonId = 10;
        const teamId = 5;

        mockReq.body = {
          steam_id: steamId,
          role,
          season_id: seasonId,
          team_id: teamId
        };

        mockHelpers.mockUserInfoExists(accountId, nickname);
        mockHelpers.mockPlayerNotInTeam();

        await addRole(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining(
              "is not on this team for this season"
            ),
            status: 400
          })
        );

        // Verify transaction was rolled back
        expect(mockConnection.rollback).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();

        // Should not attempt to update any tables
        expect(mockRunQuery).not.toHaveBeenCalled();
        expect(mockSetRoleForAccount).not.toHaveBeenCalled();
      });

      it("should throw BadRequestError if season_id provided without team_id", async () => {
        const steamId = "76561198000000005";
        const role = "captain";
        const seasonId = 10;

        mockReq.body = {
          steam_id: steamId,
          role,
          season_id: seasonId
          // team_id missing
        };

        await addRole(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message:
              "Both season_id and team_id must be provided together, or neither",
            status: 400
          })
        );
      });

      it("should throw BadRequestError if team_id provided without season_id", async () => {
        const steamId = "76561198000000006";
        const role = "captain";
        const teamId = 5;

        mockReq.body = {
          steam_id: steamId,
          role,
          team_id: teamId
          // season_id missing
        };

        await addRole(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message:
              "Both season_id and team_id must be provided together, or neither",
            status: 400
          })
        );
      });

      it("should update team assignment if user already has global captain role", async () => {
        const steamId = "76561198000000007";
        const accountId = 999;
        const nickname = "ExistingCaptain";
        const role = "captain";
        const seasonId = 10;
        const teamId = 5;

        mockReq.body = {
          steam_id: steamId,
          role,
          season_id: seasonId,
          team_id: teamId
        };

        mockHelpers.mockUserAlreadyHasRoleWithTeamContext(accountId, nickname);

        await addRole(mockReq as Request, mockRes as Response, mockNext);

        // Should still update SeasonTeamPlayers (with connection)
        expect(mockRunQuery).toHaveBeenNthCalledWith(
          1,
          expect.stringContaining(
            "UPDATE SeasonTeamPlayers SET is_captain = 0"
          ),
          [seasonId, teamId],
          mockConnection
        );

        expect(mockRunQuery).toHaveBeenNthCalledWith(
          2,
          expect.stringContaining(
            "UPDATE SeasonTeamPlayers SET is_captain = 1"
          ),
          [seasonId, teamId, steamId],
          mockConnection
        );

        // Verify transaction was committed
        expect(mockConnection.commit).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();

        // Should NOT call setRoleForAccount since they already have it
        expect(mockSetRoleForAccount).not.toHaveBeenCalled();

        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          message: "captain role assigned to team successfully",
          data: { account_id: accountId, nickname, steam_id: steamId, role }
        });
      });

      it("should NOT update SeasonTeamRegistrationPlayers table", async () => {
        const steamId = "76561198000000008";
        const accountId = 111;
        const nickname = "TestCaptain";
        const role = "captain";
        const seasonId = 10;
        const teamId = 5;

        mockReq.body = {
          steam_id: steamId,
          role,
          season_id: seasonId,
          team_id: teamId
        };

        mockHelpers.mockSuccessfulCaptainAssignment(accountId, nickname);

        await addRole(mockReq as Request, mockRes as Response, mockNext);

        // Verify NO queries were made to SeasonTeamRegistrationPlayers
        const allCalls = mockRunQuery.mock.calls;
        for (const call of allCalls) {
          const query = call[0] as string;
          expect(query).not.toContain("SeasonTeamRegistrationPlayers");
        }
      });
    });
  });

  describe("removeRole", () => {
    it("should remove caster role for valid steam_id with admin permission", async () => {
      const steamId = "76561198000000001";
      const accountId = 123;
      const nickname = "TestUser";
      const role = "caster";

      mockReq.body = { steam_id: steamId, role };
      mockHelpers.mockUserInfoExists(accountId, nickname);
      mockHelpers.mockUserHasRoleTrue();

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
      mockHelpers.mockUserInfoExists(accountId, nickname);
      mockHelpers.mockUserHasRoleTrue();

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
      mockHelpers.mockUserInfoExists(accountId, nickname);
      mockHelpers.mockUserHasRoleFalse();

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
        data: ["admin", "helpdesk", "caster", "captain", "co-captain"]
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
        data: ["helpdesk", "caster", "captain", "co-captain"]
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
        data: ["caster", "captain", "co-captain"]
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
