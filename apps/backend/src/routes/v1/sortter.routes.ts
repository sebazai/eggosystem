import { Router } from "express";
import {
  getTeamValuesController,
  getTeamValueByIdController,
  getTeamPlayerValuesController
} from "../../controllers/sortter.controllers";
import { populateKanaeloQueueController } from "../../controllers/kanaelo.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import { validateApiKey } from "../../middlewares/api-key-auth.middleware";

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

// POST /api/v1/sortter/season/:season_id/populate-kanaelo-queue
router.post(
  "/season/:season_id/populate-kanaelo-queue",
  validateApiKey,
  validateNumericParams(["season_id"]),
  populateKanaeloQueueController
);

export default router;
