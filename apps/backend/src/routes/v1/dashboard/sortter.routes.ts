import { Router } from "express";
import {
  getTeamValuesController,
  getTeamValueByIdController,
  getTeamPlayerValuesController,
  getTeamsForSeasonController,
  checkPlayerAdditionEligibilityController
} from "../../../controllers/sortter.controllers";
import {
  getPreliminaryPlacementsController,
  savePreliminaryPlacementsController,
  finalizeTeamPlacementsController,
  getPlacementsFinalizationStatusController
} from "../../../controllers/sortter-placements.controllers";
import { populateKanaeloQueueController } from "../../../controllers/kanaelo.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";

const router = Router();

// GET /api/v1/dashboard/sortter/season/:season_id/teams
router.get(
  "/season/:season_id/teams",
  validateNumericParams(),
  getTeamValuesController
);

// GET /api/v1/dashboard/sortter/season/:season_id/team/:team_id
router.get(
  "/season/:season_id/team/:team_id",
  validateNumericParams(),
  getTeamValueByIdController
);

// GET /api/v1/dashboard/sortter/season/:season/team/:team/playervalues
router.get(
  "/season/:season_id/team/:team_id/playervalues",
  validateNumericParams(),
  getTeamPlayerValuesController
);

// GET /api/v1/dashboard/sortter/season/:season_id/teams
router.get(
  "/season/:season_id/teams",
  validateNumericParams(),
  getTeamsForSeasonController
);

// GET /api/v1/dashboard/sortter/season/:season_id/team/:team_id/player/:steam_id/eligibility
router.get(
  "/season/:season_id/team/:team_id/player/:steam_id/eligibility",
  validateNumericParams(["season_id", "team_id"]),
  checkPlayerAdditionEligibilityController
);

// POST /api/v1/dashboard/sortter/season/:season_id/populate-kanaelo-queue
router.post(
  "/season/:season_id/populate-kanaelo-queue",
  validateNumericParams(),
  populateKanaeloQueueController
);

// GET /api/v1/dashboard/sortter/season/:season_id/placements
router.get(
  "/season/:season_id/placements",
  validateNumericParams(),
  getPreliminaryPlacementsController
);

// GET /api/v1/dashboard/sortter/season/:season_id/finalization-status
router.get(
  "/season/:season_id/finalization-status",
  validateNumericParams(),
  getPlacementsFinalizationStatusController
);

// POST /api/v1/dashboard/sortter/season/:season_id/placements
router.post(
  "/season/:season_id/placements",
  validateNumericParams(),
  savePreliminaryPlacementsController
);

// POST /api/v1/dashboard/sortter/season/:season_id/finalize
router.post(
  "/season/:season_id/finalize",
  validateNumericParams(),
  finalizeTeamPlacementsController
);

export default router;
