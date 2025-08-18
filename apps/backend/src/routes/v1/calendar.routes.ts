import { Router } from "express";
import { getMatchesBySeasonAndLeagueController } from "../../controllers/calendar.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.get(
  "/seasons/:season_id/leagues/:league_id/matches",
  validateNumericParams(["season_id"]),
  getMatchesBySeasonAndLeagueController
);

export default router;
