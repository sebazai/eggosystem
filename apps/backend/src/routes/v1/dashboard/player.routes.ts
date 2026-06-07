import { Router } from "express";
import {
  addPlayerToTeamController,
  addSubstitutePlayerController,
  validatePlayerController,
  preparePlayerForSignupController,
  discardPlayerController
} from "../../../controllers/dashboard/player.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";
import { getPlayerBySteamIdController } from "../../../controllers/players.controllers";
import { checkPermissions } from "../../../middlewares/auth.middleware";

const router = Router();

// POST /api/v1/dashboard/players/:steam_id/seasons/:season_id/team/:team_id/add
router.post(
  "/:steam_id/team/:team_id/season/:season_id/add",
  validateNumericParams(["season_id", "team_id"]),
  addPlayerToTeamController
);

// GET /api/v1/dashboard/players/:steam_id/validate?season_id=:season_id
router.get("/:steam_id/validate", validatePlayerController);

// POST /api/v1/dashboard/players/:steam_id/team/:team_id/season/:season_id/substitute
router.post(
  "/:steam_id/team/:team_id/season/:season_id/substitute",
  validateNumericParams(["season_id", "team_id"]),
  addSubstitutePlayerController
);

router.get("/:steam_id", getPlayerBySteamIdController);

// POST /api/v1/dashboard/players/:steam_id/prepare-for-signup
router.post("/:steam_id/prepare-for-signup", preparePlayerForSignupController);

// POST /api/v1/dashboard/players/:steam_id/team/:team_id/season/:season_id/discard
router.post(
  "/:steam_id/team/:team_id/season/:season_id/discard",
  validateNumericParams(["season_id", "team_id"]),
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  discardPlayerController
);

export default router;
