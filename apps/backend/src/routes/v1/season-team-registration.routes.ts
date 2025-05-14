import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

import {
  addSignupForSeasonController,
  getPlayerApprovedByOrganizer,
  getTeamSignupDetails,
  updateTeamSignupDetails
} from "../../controllers/season-team-registration.controllers";
import {
  authenticateJWT,
  checkJWTPermissions
} from "../../middlewares/auth.middleware";

const router = Router();
router.get(
  "/season/:season_id/team/:team_id/player/:steam_id/approved-manually",
  validateNumericParams(["season_id", "team_id"]),
  authenticateJWT,
  getPlayerApprovedByOrganizer
);
router.get(
  "/season/:season_id/signup/team/:team_id",
  validateNumericParams(),
  authenticateJWT,
  checkJWTPermissions({
    role: "captain",
    action: "edit-registration",
    paramKeys: ["season_id", "team_id"],
    fallbackRoles: ["admin"]
  }),
  getTeamSignupDetails
);
router.post(
  "/season/:season_id/signup",
  validateNumericParams(),
  authenticateJWT,
  addSignupForSeasonController
);
router.put(
  "/season/:season_id/signup/team/:team_id",
  validateNumericParams(),
  authenticateJWT,
  checkJWTPermissions({
    role: "captain",
    action: "edit-registration",
    paramKeys: ["season_id", "team_id"],
    fallbackRoles: ["admin"]
  }),
  updateTeamSignupDetails
);

export default router;
