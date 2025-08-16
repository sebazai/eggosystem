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
import { cacheResponseMiddleware } from "../../middlewares/cache-filtered-queries";

const router = Router();

router.get(
  "/seasons/:season_id/leagues",
  validateNumericParams(),
  getLeaguesBySeasonController
);
router.get(
  "/seasons/:season_id/teams/league/:league_id",
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

router.get("/players/:steam_id", getPlayerBySteamIdController);
router.get(
  "/players/:steam_id/statistics",
  parseQueryFilterParams,
  cacheResponseMiddleware({
    cachePrefix: "filtered"
  }),
  getFilteredPlayerStatisticsController
);

export default router;
