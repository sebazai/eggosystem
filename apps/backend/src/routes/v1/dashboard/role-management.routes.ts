import { Router } from "express";
import {
  addRole,
  removeRole,
  listUsersWithRole,
  getManageableRoles
} from "../../../controllers/dashboard/role-management.controllers";

const router = Router();

/**
 * @route GET /api/v1/dashboard/role-management/manageable-roles
 * @desc Get roles that the current user can manage
 * @access Private (helpdesk, admin)
 */
router.get("/manageable-roles", getManageableRoles);

/**
 * @route GET /api/v1/dashboard/role-management/:role
 * @desc List all users with a specific role
 * @access Private (helpdesk, admin)
 */
router.get("/:role", listUsersWithRole);

/**
 * @route POST /api/v1/dashboard/role-management
 * @desc Add a role to a user
 * @access Private (helpdesk, admin)
 */
router.post("/", addRole);

/**
 * @route DELETE /api/v1/dashboard/role-management
 * @desc Remove a role from a user
 * @access Private (helpdesk, admin)
 */
router.delete("/", removeRole);

export default router;
