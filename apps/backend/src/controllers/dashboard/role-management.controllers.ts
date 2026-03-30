import { type Request, type Response, type NextFunction } from "express";
import type {
  ManageableRolesResponse,
  RoleActionResponse,
  RoleResponse,
  RoleUser,
  CaptainCheckResponse,
  RequestWithQuery,
  RequestWithBody,
  RoleActionRequest
} from "@eggosystem/types";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";
import {
  setRoleForAccount,
  removeRoleForAccount,
  userHasRole,
  removeCaptainFromTeam
} from "../../models/account-roles.models";
import { getUserInfoBySteamId } from "../../models/account.models";
import { getDiscordInfoByAccountId } from "../../models/discord.models";
import { getSeasonTeamPlayerCaptainFlags } from "../../models/season-team-players.models";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError
} from "../../utils/errors";
import {
  canManageRole,
  isValidRole,
  getManageableRoles as getManageableRolesUtil
} from "../../utils/role-permissions";

/**
 * Add a role to a user by Steam ID
 */
export const addRole = async (
  req: RequestWithBody<RoleActionRequest>,
  res: Response<RoleActionResponse>,
  next: NextFunction
) => {
  if (!req.body) {
    return next(new BadRequestError("Request body is required"));
  }

  const { steam_id, role, season_id, team_id } = req.body;
  const userRoles = req.auth?.roles || [];

  if (!steam_id) {
    return next(new BadRequestError("Steam ID is required"));
  }

  if (!role) {
    return next(new BadRequestError("Role is required"));
  }

  if (!isValidRole(role)) {
    return next(new BadRequestError(`Invalid role: ${role}`));
  }

  // Validate season_id and team_id pairing
  if ((season_id && !team_id) || (!season_id && team_id)) {
    return next(
      new BadRequestError(
        "Both season_id and team_id must be provided together, or neither"
      )
    );
  }

  // Check if user has permission to manage this role
  const hasPermission = userRoles.some((userRole) =>
    canManageRole(userRole, role)
  );
  if (!hasPermission) {
    return next(
      new ForbiddenError(`You don't have permission to add ${role} role`)
    );
  }

  // Get account_id and nickname from steam_id (outside transaction)
  const userInfo = await getUserInfoBySteamId(steam_id);

  if (!userInfo) {
    return next(new NotFoundError("User not found for the provided Steam ID"));
  }

  const { account_id, nickname } = userInfo;

  // Use transaction for captain/co-captain with season/team context
  if ((role === "captain" || role === "co-captain") && season_id && team_id) {
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      // VALIDATION: Player MUST exist in SeasonTeamPlayers (active row)
      const captainFlags = await getSeasonTeamPlayerCaptainFlags(
        steam_id,
        season_id,
        team_id,
        connection
      );

      if (!captainFlags) {
        await connection.rollback();
        return next(
          new BadRequestError(
            `Player with Steam ID ${steam_id} is not on this team for this season. ` +
              `Players must be added to the finalized team roster before assigning captain/co-captain roles.`
          )
        );
      }

      if (role === "captain" && captainFlags.is_co_captain) {
        await connection.rollback();
        return next(
          new BadRequestError(
            "This player is already co-captain for this team; remove co-captain before assigning captain."
          )
        );
      }

      if (role === "co-captain" && captainFlags.is_captain) {
        await connection.rollback();
        return next(
          new BadRequestError(
            "This player is already captain for this team; remove captain before assigning co-captain."
          )
        );
      }

      // Captain/co-captain must have a real Discord link (not a `fake_` placeholder).
      // If not, we rollback so the old captain isn't replaced.
      const discordInfo = await getDiscordInfoByAccountId(
        account_id,
        connection
      );
      if (!discordInfo) {
        await connection.rollback();
        return next(
          new BadRequestError(
            "Captains and co-captains must link their Discord account in their profile."
          )
        );
      }

      const field = role === "captain" ? "is_captain" : "is_co_captain";

      // Remove captain flag from old captain (if exists)
      await runQuery(
        `UPDATE SeasonTeamPlayers SET ${field} = 0 
         WHERE season_id = ? AND team_id = ? AND ${field} = 1`,
        [season_id, team_id],
        connection
      );

      // Set new captain
      await runQuery(
        `UPDATE SeasonTeamPlayers SET ${field} = 1 
         WHERE season_id = ? AND team_id = ? AND steam_id = ?`,
        [season_id, team_id, steam_id],
        connection
      );

      // Check if user already has the global captain role
      // Note: Both captain and co-captain use the 'captain' role in AccountRoles
      const hasRole = await userHasRole(account_id, "captain", connection);

      // Add global captain role if they don't have it
      if (!hasRole) {
        await setRoleForAccount("captain", account_id, connection);
      }

      await connection.commit();

      res.json({
        success: true,
        message: hasRole
          ? `${role} role assigned to team successfully`
          : `${role} role added and assigned to team successfully`,
        data: { account_id, nickname, steam_id, role }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    return;
  }

  // Non-transaction path for roles without season/team context
  try {
    // Check if user already has the global role
    const hasRole = await userHasRole(account_id, role);

    if (hasRole) {
      return next(new BadRequestError(`User already has ${role} role`));
    }

    // Add global role
    await setRoleForAccount(role, account_id);

    res.json({
      success: true,
      message: `${role} role added successfully`,
      data: { account_id, nickname, steam_id, role }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a role from a user by Steam ID
 */
export const removeRole = async (
  req: RequestWithBody<RoleActionRequest>,
  res: Response<RoleActionResponse>,
  next: NextFunction
) => {
  if (!req.body) {
    return next(new BadRequestError("Request body is required"));
  }

  const { steam_id, role, season_id, team_id } = req.body;
  const userRoles = req.auth?.roles || [];

  if (!steam_id) {
    return next(new BadRequestError("Steam ID is required"));
  }

  if (!role) {
    return next(new BadRequestError("Role is required"));
  }

  if (!isValidRole(role)) {
    return next(new BadRequestError(`Invalid role: ${role}`));
  }

  // Validate season_id and team_id pairing for captain/co-captain roles
  if (role === "captain" || role === "co-captain") {
    if ((season_id && !team_id) || (!season_id && team_id)) {
      return next(
        new BadRequestError(
          "Both season_id and team_id must be provided together for captain/co-captain removal, or neither"
        )
      );
    }
  }

  // Check if user has permission to manage this role
  const hasPermission = userRoles.some((userRole) =>
    canManageRole(userRole, role)
  );
  if (!hasPermission) {
    return next(
      new ForbiddenError(`You don't have permission to remove ${role} role`)
    );
  }

  // Get account_id and nickname from steam_id (outside transaction)
  const userInfo = await getUserInfoBySteamId(steam_id);

  if (!userInfo) {
    return next(new NotFoundError("User not found for the provided Steam ID"));
  }

  const { account_id, nickname } = userInfo;

  // Use transaction for captain/co-captain with season/team context
  if ((role === "captain" || role === "co-captain") && season_id && team_id) {
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      // Use helper function to remove captain status
      const { roleRetained } = await removeCaptainFromTeam(
        steam_id,
        account_id,
        role,
        season_id,
        team_id,
        connection
      );

      await connection.commit();

      res.json({
        success: true,
        message: roleRetained
          ? `${role} role removed from team successfully (role retained for other teams)`
          : `${role} role removed successfully`,
        data: { account_id, nickname, steam_id, role }
      });
    } catch (error) {
      await connection.rollback();

      // If it's a validation error from the helper, return a proper error response
      if (error instanceof Error && error.message.includes("is not a")) {
        return next(new BadRequestError(error.message));
      }

      throw error;
    } finally {
      connection.release();
    }
    return;
  }

  // Non-transaction path for roles without season/team context
  try {
    // Check if user has this role
    const hasRole = await userHasRole(account_id, role);

    if (!hasRole) {
      return next(new BadRequestError(`User does not have ${role} role`));
    }

    // Remove role
    await removeRoleForAccount(role, account_id);

    res.json({
      success: true,
      message: `${role} role removed successfully`,
      data: { account_id, nickname, steam_id, role }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all users with a specific role
 */
export const listUsersWithRole = async (
  req: Request,
  res: Response<RoleResponse>,
  next: NextFunction
) => {
  const { role } = req.params;
  const userRoles = req.auth?.roles || [];

  if (!role) {
    return next(new BadRequestError("Role parameter is required"));
  }

  if (!isValidRole(role)) {
    return next(new BadRequestError(`Invalid role: ${role}`));
  }

  // Check if user has permission to view this role
  const hasPermission = userRoles.some((userRole) =>
    canManageRole(userRole, role)
  );
  if (!hasPermission) {
    return next(
      new ForbiddenError(`You don't have permission to view ${role} role users`)
    );
  }

  try {
    const users = await runQuery<RoleUser[]>(
      `SELECT 
        ar.account_id,
        sp.nickname,
        la.provider_id as steam_id
      FROM AccountRoles ar
      JOIN Roles r ON ar.role_id = r.id
      JOIN SteamPlayers sp ON ar.account_id = sp.account_id
      JOIN LinkedAccounts la ON ar.account_id = la.account_id
      WHERE r.role_name = ? AND la.provider = 'steam'
      ORDER BY sp.nickname`,
      [role]
    );

    res.json({
      success: true,
      data: users || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available roles that the current user can manage
 */
export const getManageableRoles = async (
  req: Request,
  res: Response<ManageableRolesResponse>,
  next: NextFunction
) => {
  const userRoles = req.auth?.roles || [];

  try {
    const manageableRoles = userRoles.flatMap((role) =>
      getManageableRolesUtil(role)
    );
    const uniqueRoles = [...new Set(manageableRoles)];

    res.json({
      success: true,
      data: uniqueRoles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if a captain or co-captain exists for a specific team/season
 */
export const checkExistingCaptain = async (
  req: RequestWithQuery<{ season_id: string; team_id: string; role: string }>,
  res: Response<CaptainCheckResponse>,
  next: NextFunction
) => {
  const { season_id, team_id, role } = req.query;

  if (!season_id || !team_id || !role) {
    return next(
      new BadRequestError("season_id, team_id, and role are required")
    );
  }

  const seasonAsNum = parseInt(season_id, 10);
  const teamAsNum = parseInt(team_id, 10);

  if (isNaN(seasonAsNum) || isNaN(teamAsNum)) {
    return next(
      new BadRequestError("season_id and team_id must be valid numbers")
    );
  }

  if (role !== "captain" && role !== "co-captain") {
    return next(
      new BadRequestError("role must be either 'captain' or 'co-captain'")
    );
  }

  try {
    const field = role === "captain" ? "is_captain" : "is_co_captain";

    const result = await runQuery<
      Array<{ steam_id: string; nickname: string }>
    >(
      `SELECT stp.steam_id, sp.nickname 
       FROM SeasonTeamPlayers stp
       JOIN SteamPlayers sp ON stp.steam_id = sp.steam_id
       WHERE stp.season_id = ? AND stp.team_id = ? AND stp.${field} = 1
         AND stp.discarded_at IS NULL`,
      [seasonAsNum, teamAsNum]
    );

    res.json({
      success: true,
      data: result.length > 0 ? result[0] : null
    });
  } catch (error) {
    next(error);
  }
};
