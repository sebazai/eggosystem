import { Router } from "express";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";
import {
  getTeamsForSeasonController,
  checkPlayerAdditionEligibilityController,
  createSeasonController
} from "../../../controllers/dashboard/season.controllers";

const router = Router();

// POST /api/v1/dashboard/seasons
router.post("/", createSeasonController);

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
