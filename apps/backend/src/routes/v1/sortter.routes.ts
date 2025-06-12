import { Router } from "express";
import {
  getTeamValuesController,
  getTeamValueByIdController,
  getTeamPlayerValuesController
} from "../../controllers/sortter.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

// GET /api/v1/sortter/season/:season_id
router.get(
  "/season/:season_id",
  validateNumericParams(["season_id"]),
  getTeamValuesController
);

// GET /api/v1/sortter/season/:season_id/team/:team_id
router.get(
  "/season/:season_id/team/:team_id",
  validateNumericParams(["season_id", "team_id"]),
  getTeamValueByIdController
);

// GET /api/v1/sortter/season/:season/team/:team/playervalues
router.get(
  "/season/:season/team/:team/playervalues",
  validateNumericParams(["season", "team"]),
  getTeamPlayerValuesController
);

export default router;
