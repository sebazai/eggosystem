import type { Request, Response, NextFunction } from "express";
import { getPermissionsForAccountId } from "../../services/auth.services";
import { checkPermission } from "../../middlewares/auth.middleware";

jest.mock("../../services/auth.services", () => ({
  getPermissionsForAccountId: jest.fn()
}));

const mockedGetPermissions = getPermissionsForAccountId as jest.MockedFunction<
  typeof getPermissionsForAccountId
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

    const middleware = checkPermission({});
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Forbidden: Requires authentication" }
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow if static permission matches", async () => {
    mockedGetPermissions.mockResolvedValue(["admin:access"]);

    const middleware = checkPermission({ staticPermissions: ["admin:access"] });
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should allow if dynamic permission matches", async () => {
    req.params = { season_id: "1", team_id: "2" };
    mockedGetPermissions.mockResolvedValue([
      "captain:edit-registration:season-1:team-2"
    ]);

    const middleware = checkPermission({
      role: "captain",
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"]
    });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 if a required paramKey is missing", async () => {
    req.params = { season_id: "1" }; // team_id missing
    mockedGetPermissions.mockResolvedValue([]);

    const middleware = checkPermission({
      role: "captain",
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"]
    });

    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Missing route param: team_id" }
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow if fallback role matches", async () => {
    mockedGetPermissions.mockResolvedValue(["moderator"]);

    const middleware = checkPermission({ fallbackRoles: ["moderator"] });

    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should forbid if no permissions match", async () => {
    req.params = { season_id: "1", team_id: "2" };
    mockedGetPermissions.mockResolvedValue(["other:permission"]);

    const middleware = checkPermission({
      staticPermissions: ["admin:access"],
      role: "captain",
      action: "edit-registration",
      paramKeys: ["season_id", "team_id"],
      fallbackRoles: ["moderator"]
    });

    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Forbidden: Insufficient permissions" }
    });
    expect(next).not.toHaveBeenCalled();
  });
});
