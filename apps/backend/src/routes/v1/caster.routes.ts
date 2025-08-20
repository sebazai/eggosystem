import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  getLeaguesBySeasonController,
  getMatchGamesByTeamController,
  getTeamsByLeagueController,
  getTeamKeyPlayersController,
  getTeamPlayersController
} from "../../controllers/caster.controllers";
import {
  getFilteredPlayerStatisticsController,
  getPlayerBySteamIdController
} from "../../controllers/players.controllers";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";
import { getFilteredTeamIdDetailsController } from "../../controllers/teams.controllers";
import { getTeamEnhancedMapStatsController } from "../../controllers/team-map-stats.controllers";
import { getMatchesBySeasonIdController } from "../../controllers/matches.controllers";

const router = Router();

router.get(
  "/seasons/:season_id/leagues",
  validateNumericParams(),
  getLeaguesBySeasonController
);
router.get(
  "/seasons/:season_id/league/:league_id/teams",
  validateNumericParams(),
  getTeamsByLeagueController
);
router.get(
  "/seasons/:season_id/teams/:team_id/players",
  validateNumericParams(),
  getTeamPlayersController
);
router.get(
  "/seasons/:season_id/teams/:team_id/keyplayers",
  validateNumericParams(),
  getTeamKeyPlayersController
);
router.get(
  "/seasons/:season_id/matches/team/:team_id/games",
  validateNumericParams(),
  getMatchGamesByTeamController
);
router.get("/seasons/:season_id/matches", getMatchesBySeasonIdController);

router.get("/players/:steam_id", getPlayerBySteamIdController);

// Filters, do not cache these routes
router.get(
  "/players/:steam_id/statistics",
  parseQueryFilterParams,
  getFilteredPlayerStatisticsController
);
router.get(
  "/teams/:team_id/details",
  parseQueryFilterParams,
  validateNumericParams(),
  getFilteredTeamIdDetailsController
);
router.get(
  "/teams/:team_id/enhanced-map-stats",
  parseQueryFilterParams,
  validateNumericParams(["team_id"]),
  getTeamEnhancedMapStatsController
);

export default router;
