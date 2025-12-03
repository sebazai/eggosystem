import { Router } from "express";
import {
  getTeamValuesController,
  getTeamValueByIdController,
  getTeamPlayerValuesController,
  getTeamPlayerValuesLiveController,
  getTeamFlagsController,
  refreshTeamFlagsFromDatabaseController,
  refreshTeamFlagsForSeasonController
} from "../../../controllers/dashboard/sortter.controllers";
import { retryFailedKanaeloCalculationsController } from "../../../controllers/dashboard/kanaelo-retry.controllers";
import {
  getPreliminaryPlacementsController,
  savePreliminaryPlacementsController,
  finalizeTeamPlacementsController,
  getPlacementsFinalizationStatusController
} from "../../../controllers/dashboard/sortter-placements.controllers";
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

// GET /api/v1/dashboard/sortter/season/:season/team/:team/players
router.get(
  "/season/:season_id/team/:team_id/players",
  validateNumericParams(),
  getTeamPlayerValuesLiveController
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

// GET /api/v1/dashboard/sortter/team-flags
router.get("/team-flags", getTeamFlagsController);

// POST /api/v1/dashboard/sortter/team-flags (triggers database refresh)
router.post("/team-flags", refreshTeamFlagsFromDatabaseController);

// POST /api/v1/dashboard/sortter/team-flags/season/:season_id (creates flags for specific season)
router.post(
  "/team-flags/season/:season_id",
  validateNumericParams(),
  refreshTeamFlagsForSeasonController
);

// POST /api/v1/dashboard/sortter/retry-failed-calculations
router.post(
  "/retry-failed-calculations",
  retryFailedKanaeloCalculationsController
);

export default router;
