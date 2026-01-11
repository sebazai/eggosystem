import { Router } from "express";
import {
  lookupAccountController,
  regenerateTokenController
} from "../../../controllers/dashboard/email-verification.controllers";
import { checkPermissions } from "../../../middlewares/auth.middleware";

const router = Router();

// GET /api/v1/dashboard/email-verification/lookup
// Look up account by various methods (Steam ID, Account ID, Nickname, Email)
router.get(
  "/lookup",
  checkPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
  lookupAccountController
);

// POST /api/v1/dashboard/email-verification/regenerate
// Regenerate verification token for an account
router.post(
  "/regenerate",
  checkPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
  regenerateTokenController
);

export default router;
