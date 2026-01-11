import type { Request, Response, NextFunction } from "express";
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../services/auth.services";
import { checkPermissions, checkJWTPermissions } from "./auth.middleware";

jest.mock("../services/auth.services", () => ({
  getPermissionsForAccountId: jest.fn(),
  getRolesForAccountId: jest.fn()
}));

const mockedGetPermissions = getPermissionsForAccountId as jest.MockedFunction<
  typeof getPermissionsForAccountId
>;

const mockedGetRoles = getRolesForAccountId as jest.MockedFunction<
  typeof getRolesForAccountId
>;

describe("checkPermission middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {},
      auth: {
        account_id: 123,
        provider_id: "",
        permissions: [],
        roles: [],
        nickname: "",
        provider: "steam"
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should forbid if no authentication", async () => {
    req.auth = undefined;

    const middleware = checkPermissions({});
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Forbidden: Requires authentication",
        status: 401
      })
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should allow if static permission matches", async () => {
    mockedGetPermissions.mockResolvedValue(["admin:access"]);
    mockedGetRoles.mockResolvedValue([]);

    const middleware = checkPermissions({
      staticPermissions: ["admin:access"]
    });
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow if dynamic permission matches", async () => {
    req.params = { season_id: "1", team_id: "2" };
    mockedGetPermissions.mockResolvedValue([
      "captain:edit-registration:season-1:team-2"
    ]);
    mockedGetRoles.mockResolvedValue([]);

    const middleware = checkPermissions({
      role: "captain",
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"]
    });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow if direct permission scope matches (no role prefix)", async () => {
    req.params = { season_id: "1", team_id: "2" };
    mockedGetPermissions.mockResolvedValue([
      "edit-registration:season-1:team-2" // No role prefix
    ]);
    mockedGetRoles.mockResolvedValue([]);

    const middleware = checkPermissions({
      role: "captain",
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"]
    });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow direct permission scope when role param is not provided", async () => {
    req.params = { season_id: "1", team_id: "2" };
    mockedGetPermissions.mockResolvedValue([
      "edit-registration:season-1:team-2" // Direct permission without role
    ]);
    mockedGetRoles.mockResolvedValue([]);

    const middleware = checkPermissions({
      // role is undefined/not provided
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"]
    });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow even if paramKeys are in different order (auto-sorts to canonical order)", async () => {
    req.params = { season_id: "1", team_id: "2" };
    mockedGetPermissions.mockResolvedValue([
      "edit-registration:season-1:team-2" // Permission stored with season first
    ]);
    mockedGetRoles.mockResolvedValue([]);

    const middleware = checkPermissions({
      action: "edit-registration",
      paramKeys: ["team_id", "season_id"] // Different order: team first!
    });

    await middleware(req as Request, res as Response, next);

    // Should be ALLOWED because buildPermissionScope auto-sorts to canonical order
    // ["team_id", "season_id"] gets sorted to ["season_id", "team_id"]
    // which builds "edit-registration:season-1:team-2" (matches!)
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 if a required paramKey is missing", async () => {
    req.params = { season_id: "1" }; // team_id missing
    mockedGetPermissions.mockResolvedValue([]);
    mockedGetRoles.mockResolvedValue([]);

    const middleware = checkPermissions({
      role: "captain",
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"]
    });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Missing route param: team_id",
        status: 400
      })
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should allow if fallback role matches", async () => {
    mockedGetPermissions.mockResolvedValue([]);
    mockedGetRoles.mockResolvedValue(["moderator"]);

    const middleware = checkPermissions({ fallbackRoles: ["moderator"] });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should forbid if no permissions match", async () => {
    req.params = { season_id: "1", team_id: "2" };
    mockedGetPermissions.mockResolvedValue(["other:permission"]);
    mockedGetRoles.mockResolvedValue(["captain"]);

    const middleware = checkPermissions({
      staticPermissions: ["admin:access"],
      role: "captain",
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"],
      fallbackRoles: ["moderator"]
    });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Forbidden: Insufficient permissions",
        status: 403
      })
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe("checkJWTPermission middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {},
      auth: {
        account_id: 123,
        provider_id: "",
        permissions: [],
        roles: [],
        nickname: "",
        provider: "steam"
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should forbid if no authentication", async () => {
    req.auth = undefined;

    const middleware = checkJWTPermissions({});
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Forbidden: Requires authentication",
        status: 403
      })
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should allow if static permission matches in permissions array", async () => {
    req.auth = {
      account_id: 123,
      provider_id: "",
      permissions: ["admin:access"],
      roles: [],
      nickname: "",
      provider: "steam"
    };

    const middleware = checkJWTPermissions({
      staticPermissions: ["admin:access"]
    });
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow if dynamic permission matches in permissions array", async () => {
    req.params = { season_id: "1", team_id: "2" };
    req.auth = {
      account_id: 123,
      provider_id: "",
      permissions: ["captain:edit-registration:season-1:team-2"],
      roles: [],
      nickname: "",
      provider: "steam"
    };

    const middleware = checkJWTPermissions({
      role: "captain",
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"]
    });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow if direct permission scope matches (no role prefix)", async () => {
    req.params = { season_id: "1", team_id: "2" };
    req.auth = {
      account_id: 123,
      provider_id: "",
      permissions: ["edit-registration:season-1:team-2"], // No role prefix
      roles: [],
      nickname: "",
      provider: "steam"
    };

    const middleware = checkJWTPermissions({
      role: "captain",
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"]
    });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow direct permission scope when role param is not provided", async () => {
    req.params = { season_id: "1", team_id: "2" };
    req.auth = {
      account_id: 123,
      provider_id: "",
      permissions: ["edit-registration:season-1:team-2"], // Direct permission without role
      roles: [],
      nickname: "",
      provider: "steam"
    };

    const middleware = checkJWTPermissions({
      // role is undefined/not provided
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"]
    });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow even if paramKeys are in different order (auto-sorts to canonical order)", async () => {
    req.params = { season_id: "1", team_id: "2" };
    req.auth = {
      account_id: 123,
      provider_id: "",
      permissions: ["edit-registration:season-1:team-2"], // Permission stored with season first
      roles: [],
      nickname: "",
      provider: "steam"
    };

    const middleware = checkJWTPermissions({
      action: "edit-registration",
      paramKeys: ["team_id", "season_id"] // Different order: team first!
    });

    await middleware(req as Request, res as Response, next);

    // Should be ALLOWED because buildPermissionScope auto-sorts to canonical order
    // ["team_id", "season_id"] gets sorted to ["season_id", "team_id"]
    // which builds "edit-registration:season-1:team-2" (matches!)
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 if a required paramKey is missing", async () => {
    req.params = { season_id: "1" }; // team_id missing
    req.auth = {
      account_id: 123,
      provider_id: "",
      permissions: [],
      roles: [],
      nickname: "",
      provider: "steam"
    };

    const middleware = checkJWTPermissions({
      role: "captain",
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"]
    });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Missing route param: team_id",
        status: 400
      })
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should allow if fallback role matches in roles array", async () => {
    req.auth = {
      account_id: 123,
      provider_id: "",
      permissions: [],
      roles: ["admin"],
      nickname: "",
      provider: "steam"
    };

    const middleware = checkJWTPermissions({ fallbackRoles: ["admin"] });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow admin role as fallback for placements endpoint", async () => {
    req.auth = {
      account_id: 123,
      provider_id: "",
      permissions: [],
      roles: ["admin"],
      nickname: "",
      provider: "steam"
    };

    const middleware = checkJWTPermissions({ fallbackRoles: ["admin"] });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should forbid if no permissions match", async () => {
    req.params = { season_id: "1", team_id: "2" };
    req.auth = {
      account_id: 123,
      provider_id: "",
      permissions: ["other:permission"],
      roles: ["captain"],
      nickname: "",
      provider: "steam"
    };

    const middleware = checkJWTPermissions({
      staticPermissions: ["admin:access"],
      role: "captain",
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"],
      fallbackRoles: ["moderator"]
    });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Forbidden: Insufficient permissions",
        status: 403
      })
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
