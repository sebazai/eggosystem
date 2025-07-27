import { Router } from "express";
import {
  getMatchesController,
  getMatchPlayerStatsController,
  getMatchTeamStatsController,
  getMatchTopPlayersController,
  getMatchGamesController,
  getMatchInfoController,
  getMatchController,
  getMatchGameController,
  getMatchMapVetoesController,
  getMatchBreadcrumbController,
  getMatchesBySeasonIdController
} from "../../controllers/matches.controllers";

import { validateNumericParams } from "../../middlewares/validate-numeric-params";
// New Router instance
const router = Router();

router.get("/:match_id", validateNumericParams(), getMatchController);
router.get(
  "/:match_id/breadcrumb",
  validateNumericParams(),
  getMatchBreadcrumbController
);
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
  "/:match_id/teamstats",
  validateNumericParams(),
  getMatchTeamStatsController
);
router.get(
  "/:match_id/topplayers",
  validateNumericParams(),
  getMatchTopPlayersController
);

router.get(
  "/:match_id/vetoes",
  validateNumericParams(),
  getMatchMapVetoesController
);

router.get("/", getMatchesController);
router.get("/season/:season_id", getMatchesBySeasonIdController);

export default router;
