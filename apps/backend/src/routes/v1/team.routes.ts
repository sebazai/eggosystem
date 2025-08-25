import { Router } from "express";
import {
  getAllTeams,
  getTeamByIdController,
  getTeamsWithoutOrgController
} from "../../controllers/teams.controllers";
import {
  getAllTeamCaptainsController,
  getTeamCaptainsBySeasonIdController,
  getTeamCaptainsForActiveSeasonController
} from "../../controllers/team-captains.controllers";
import {
  getFaceitLinksForSeasonController,
  getFaceitLinksForActiveSeasonController
} from "../../controllers/faceit-links.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  authenticateJWT,
  checkJWTPermissions
} from "../../middlewares/auth.middleware";

const router = Router();

// Regular team routes
router.get("/", getAllTeams);
router.get("/org-missing", getTeamsWithoutOrgController);

// Team captains routes
router.get(
  "/captains",
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["admin", "captain", "helpdesk"] }),
  getAllTeamCaptainsController
);
router.get(
  "/season/active/captains",
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["admin", "captain", "helpdesk"] }),
  getTeamCaptainsForActiveSeasonController
);
router.get(
  "/season/:season_id/captains",
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["admin", "captain", "helpdesk"] }),
  validateNumericParams(["season_id"]),
  getTeamCaptainsBySeasonIdController
);

// Faceit links routes
router.get("/faceit-links", getFaceitLinksForActiveSeasonController);
router.get(
  "/season/:season_id/faceit-links",
  validateNumericParams(["season_id"]),
  getFaceitLinksForSeasonController
);

// This needs to be last as it's a catch-all for team_id
router.get(
  "/:team_id",
  validateNumericParams(["team_id"]),
  getTeamByIdController
);

export default router;
