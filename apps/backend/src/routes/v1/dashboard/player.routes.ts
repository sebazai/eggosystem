import { Router } from "express";
import { addPlayerToTeamController } from "../../../controllers/dashboard/player.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";

const router = Router();

// POST /api/v1/dashboard/players/:steam_id/seasons/:season_id/team/:team_id/add
router.post(
  "/:season_id/team/:team_id/player/:steam_id/add",
  validateNumericParams(["season_id", "team_id"]),
  addPlayerToTeamController
);

export default router;
