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
import { expireIn7Days, redisClient } from "../../utils/redisClient";

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
router.post(
  "/season/:season_id/draft",
  validateNumericParams(),
  authenticateJWT,
  async (req, res) => {
    const steamId = req.auth?.provider_id;
    const redisKey = `signup-${steamId}`;
    await redisClient.set(
      redisKey,
      JSON.stringify(req.body),
      "EX",
      expireIn7Days
    );
    res.sendStatus(200);
  }
);
router.get(
  "/season/:season_id/draft",
  validateNumericParams(),
  authenticateJWT,
  async (req, res) => {
    const steamId = req.auth?.provider_id;
    const redisKey = `signup-${steamId}`;
    const data = await redisClient.get(redisKey);
    if (data) {
      res.json(JSON.parse(data));
      return;
    }
    res.sendStatus(404);
  }
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
