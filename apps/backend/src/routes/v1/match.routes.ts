import { Router } from "express";
import {
  getMatchesController,
  getMatchPlayerStatsController,
  getMatchTeamStatsController,
  getMatchesByFiltersController,
  getTopPlayersController,
} from "../../controllers/matches.controllers";

import parseParams from "../../middlewares/parseParams";
// New Router instance
const router = Router();

router.get(
  "/:season_id/:map/:league_id/:stage/:team_id",
  parseParams,
  getMatchesByFiltersController,
);
router.get("/:match_id/playerstats", getMatchPlayerStatsController);
router.get("/:match_id/teamstats", getMatchTeamStatsController);
router.get("/:match_id/topplayers", getTopPlayersController);
router.get("/", getMatchesController);

export default router;
