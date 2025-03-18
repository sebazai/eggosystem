import { Router } from "express";
import {
  getMatchesController,
  getMatchPlayerStatsController,
  getMatchTeamStatsController,
  getMatchesByFiltersController,
  getTopPlayersController,
  getMatchMapsPlayedController
} from "../../controllers/matches.controllers";

import parseQueryParams from "../../middlewares/parseQueryParams";
// New Router instance
const router = Router();

router.get("/recent", parseQueryParams, getMatchesByFiltersController);
router.get("/:match_id/mapsplayed", getMatchMapsPlayedController);
router.get("/:match_played_id/playerstats", getMatchPlayerStatsController);
router.get("/:match_played_id/teamstats", getMatchTeamStatsController);
router.get("/:match_played_id/topplayers", getTopPlayersController);
router.get("/", getMatchesController);

export default router;
