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
import { expireIn30Days, redisClient } from "../../utils/redisClient";
import { isRegistrationDraftRaw } from "@eggosystem/types";
import { runQuery } from "../../db/mysqlRunQuery";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
  NotFoundError
} from "../../utils/errors";

const router = Router();
router.get(
  "/season/:season_id/player/:steam_id/approved-manually",
  validateNumericParams(["season_id"]),
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
  async (req, res, next) => {
    const steamId = req.auth?.provider_id;
    const redisKey = `signup-${steamId}`;
    if (!isRegistrationDraftRaw(req.body)) {
      return next(new BadRequestError("Invalid draft structure"));
    }
    await redisClient.set(
      redisKey,
      JSON.stringify(req.body),
      "EX",
      expireIn30Days
    );
    res.sendStatus(200);
  }
);
router.get(
  "/season/:season_id/draft",
  validateNumericParams(),
  authenticateJWT,
  async (req, res, next) => {
    const steamId = req.auth?.provider_id;
    const redisKey = `signup-${steamId}`;
    const data = await redisClient.get(redisKey);
    if (data) {
      const parsed = JSON.parse(data);
      if (!isRegistrationDraftRaw(parsed)) {
        return next(new InternalServerError("Corrupted draft data in Redis"));
      }
      res.json(parsed);
      return;
    }
    return next(new NotFoundError("Draft not found"));
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
router.get(
  "/season/:season_id/my-registration",
  validateNumericParams(["season_id"]),
  authenticateJWT,
  async (req, res, next) => {
    const seasonId = Number(req.params.season_id);
    const steamId = req.auth?.provider_id;
    if (!steamId) {
      return next(new UnauthorizedError("Not authenticated"));
    }
    // Find if this steamId is a captain or co-captain for any team in this season
    const query = `
      SELECT str.team_id
      FROM SeasonTeamRegistrations str
        INNER JOIN SeasonTeamRegistrationPlayers stp ON stp.season_id = str.season_id AND stp.team_id = str.team_id
      WHERE str.season_id = ? AND stp.steam_id = ? AND (stp.is_captain = 1 OR stp.is_co_captain = 1)
      LIMIT 1
    `;
    type MyRegistrationResult = {
      team_id: number;
    };
    const result = await runQuery<MyRegistrationResult[]>(query, [
      seasonId,
      steamId
    ]);
    if (result.length === 0) {
      return next(new NotFoundError("Registration not found"));
    }
    res.json({
      teamId: result[0].team_id
    });
  }
);

export default router;
