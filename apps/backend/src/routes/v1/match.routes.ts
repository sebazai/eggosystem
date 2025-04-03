import { Router } from "express";
import {
  getMatchesController,
  getMatchPlayerStatsController,
  getMatchGamePlayerStatsController,
  getMatchTeamStatsController,
  getMatchGameTeamStatsController,
  getMatchesByFiltersController,
  getTopPlayersController,
  getGameTopPlayersController,
  getMatchGamesController,
  getMatchInfoController,
  getMatchRoundInfoController
} from "../../controllers/matches.controllers";

import parseQueryParams from "../../middlewares/parseQueryParams";
// New Router instance
const router = Router();

router.get("/recent", parseQueryParams, getMatchesByFiltersController);
router.get("/:match_id/info", getMatchInfoController);
router.get("/:match_id/mapsplayed", getMatchGamesController);
router.get("/:match_id/playerstats", getMatchPlayerStatsController);
router.get(
  "/:match_id/games/:game_id/playerstats",
  getMatchGamePlayerStatsController
);
router.get("/:match_id/teamstats", getMatchTeamStatsController);
router.get(
  "/:match_id/games/:game_id/teamstats",
  getMatchGameTeamStatsController
);
router.get("/:match_id/topplayers", getTopPlayersController);
router.get("/:match_id/games/:game_id/topplayers", getGameTopPlayersController);
router.get("/:match_id/games/:game_id/roundinfo", getMatchRoundInfoController);
router.get("/", getMatchesController);

export default router;
