import { Router } from "express";
import {
  getOrgs,
  getOrgById,
  getOrganizationApprovedTeamsController,
  getOrgTeamTrophiesController,
  getOrgDiscordInviteLinkController
} from "../../controllers/organizations.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", getOrgs);
router.get("/:id", validateNumericParams(), getOrgById);
router.get(
  "/:id/trophies",
  validateNumericParams(),
  getOrgTeamTrophiesController
);
router.get(
  "/:id/teams",
  validateNumericParams(),
  getOrganizationApprovedTeamsController
);
router.get(
  "/:id/discord-invite-link",
  validateNumericParams(),
  authenticateJWT,
  getOrgDiscordInviteLinkController
);

export default router;
