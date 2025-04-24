import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

import {
  addSignupForSeason,
  getTeamSignupDetails,
  updateTeamSignupDetails
} from "../../controllers/seasonteamregistration.controllers";
import {
  authenticateJWT,
  checkPermission
} from "../../middlewares/auth.middleware";

const router = Router();
router.get(
  "/season/:season_id/signup/team/:team_id",
  validateNumericParams(),
  authenticateJWT,
  checkPermission({
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
  addSignupForSeason
);
router.put(
  "/season/:season_id/signup/team/:team_id",
  validateNumericParams(),
  authenticateJWT,
  checkPermission({
    role: "captain",
    action: "edit-registration",
    paramKeys: ["season_id", "team_id"],
    fallbackRoles: ["admin"]
  }),
  updateTeamSignupDetails
);

export default router;
