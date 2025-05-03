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
  getMatchRoundInfoController,
  getMatchController,
  getMatchGameController
} from "../../controllers/matches.controllers";

import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
// New Router instance
const router = Router();

router.get("/recent", parseQueryFilterParams, getMatchesByFiltersController);
router.get("/:match_id", validateNumericParams(), getMatchController);
router.get("/:match_id/info", validateNumericParams(), getMatchInfoController);
router.get(
  "/:match_id/games/:game_id",
  validateNumericParams(),
  getMatchGameController
);
router.get(
  "/:match_id/mapsplayed",
  validateNumericParams(),
  getMatchGamesController
);
router.get(
  "/:match_id/playerstats",
  validateNumericParams(),
  getMatchPlayerStatsController
);
router.get(
  "/:match_id/games/:game_id/playerstats",
  validateNumericParams(),
  getMatchGamePlayerStatsController
);
router.get(
  "/:match_id/teamstats",
  validateNumericParams(),
  getMatchTeamStatsController
);
router.get(
  "/:match_id/games/:game_id/teamstats",
  validateNumericParams(),
  getMatchGameTeamStatsController
);
router.get(
  "/:match_id/topplayers",
  validateNumericParams(),
  getTopPlayersController
);
router.get(
  "/:match_id/games/:game_id/topplayers",
  validateNumericParams(),
  getGameTopPlayersController
);
router.get(
  "/:match_id/games/:game_id/roundinfo",
  validateNumericParams(),
  getMatchRoundInfoController
);
router.get("/", getMatchesController);

export default router;
