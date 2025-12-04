import { Router } from "express";
import {
  getSeasonLeaguesWithMappingsController,
  getSeasonLeagueExternalIdController,
  createSeasonLeagueExternalIdController,
  updateSeasonLeagueExternalIdController,
  deleteSeasonLeagueExternalIdController,
  updateLeagueNameController
} from "../../../controllers/dashboard/season-league-mapper.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";

const router = Router();

// GET /api/v1/dashboard/season-league-mapper/season/:season_id/season-leagues
router.get(
  "/season/:season_id/season-leagues",
  validateNumericParams(),
  getSeasonLeaguesWithMappingsController
);

// GET /api/v1/dashboard/season-league-mapper/:id
router.get(
  "/:id",
  validateNumericParams(),
  getSeasonLeagueExternalIdController
);

// POST /api/v1/dashboard/season-league-mapper
router.post("/", createSeasonLeagueExternalIdController);

// PUT /api/v1/dashboard/season-league-mapper/:id
router.put(
  "/:id",
  validateNumericParams(),
  updateSeasonLeagueExternalIdController
);

// DELETE /api/v1/dashboard/season-league-mapper/:id
router.delete(
  "/:id",
  validateNumericParams(),
  deleteSeasonLeagueExternalIdController
);

// PUT /api/v1/dashboard/season-league-mapper/league/:league_id/name
router.put(
  "/league/:league_id/name",
  validateNumericParams(),
  updateLeagueNameController
);

export default router;
