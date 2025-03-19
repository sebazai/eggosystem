import { Router } from "express";
import {
  getMatchesController,
  getMatchPlayerStatsController,
  getMatchTeamStatsController,
  getMatchesByFiltersController,
  getTopPlayersController,
  getMatchGamesController
} from "../../controllers/matches.controllers";

import parseQueryParams from "../../middlewares/parseQueryParams";
// New Router instance
const router = Router();

router.get("/recent", parseQueryParams, getMatchesByFiltersController);
router.get("/:match_id/mapsplayed", getMatchGamesController);
router.get("/:game_id/playerstats", getMatchPlayerStatsController);
router.get("/:game_id/teamstats", getMatchTeamStatsController);
router.get("/:game_id/topplayers", getTopPlayersController);
router.get("/", getMatchesController);

export default router;
