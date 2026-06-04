import { Router } from "express";
import {
  getFaceitLeaguesController,
  getStandingsController,
  getStandingsTeamsExternalIdController
} from "../../controllers/standings.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.get(
  "/season/:season_id/leagues",
  validateNumericParams(),
  getFaceitLeaguesController
);
router.get("/:faceit_league_id", getStandingsController);
router.get("/teams/:team_id", getStandingsTeamsExternalIdController);

export default router;
