import { Router } from "express";
import {
  addPlayerToTeamController,
  addSubstitutePlayerController,
  validatePlayerController
} from "../../../controllers/dashboard/player.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";

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

export default router;
