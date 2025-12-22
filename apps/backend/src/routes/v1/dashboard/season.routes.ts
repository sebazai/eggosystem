import { Router } from "express";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";
import {
  getSeasonByIdController,
  getTeamsForSeasonController,
  checkPlayerAdditionEligibilityController,
  createSeasonController,
  updateSeasonController
} from "../../../controllers/dashboard/season.controllers";

const router = Router();

// POST /api/v1/dashboard/seasons
router.post("/", createSeasonController);

// GET /api/v1/dashboard/seasons/:id
router.get("/:id", validateNumericParams(), getSeasonByIdController);

// PUT /api/v1/dashboard/seasons/:id
router.put("/:id", validateNumericParams(), updateSeasonController);

// GET /api/v1/dashboard/seasons/:season_id/teams
router.get(
  "/:season_id/teams",
  validateNumericParams(),
  getTeamsForSeasonController
);

// GET /api/v1/dashboard/seasons/:season_id/team/:team_id/player/:steam_id/eligibility
router.get(
  "/:season_id/team/:team_id/player/:steam_id/eligibility",
  validateNumericParams(["season_id", "team_id"]),
  checkPlayerAdditionEligibilityController
);

export default router;
