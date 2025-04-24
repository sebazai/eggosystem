import { Router } from "express";
import {
  getPlayerBySteamIdController,
  getIsPlayerProfilePublic,
  getPlayerSteamAppIdHours,
  getPlayerSteamAppIdRank,
  getPlayerPlatformRank,
  getPlayerStatsByFiltersController,
  getPlayerDetailsWithStatsController
  // getPlayersByFiltersController,
  // getPlayerLeaderboardController,
  // getMultipleLeaderboardsController
} from "../../controllers/players.controllers";

// import parseQueryParams from "../../middlewares/parseQueryParams";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

// New Router instance
const router = Router();

// Player routes
router.get("/stats", parseQueryFilterParams, getPlayerStatsByFiltersController);
router.get("/:steam_id/details", getPlayerBySteamIdController);
router.get("/:steam_id/public", getIsPlayerProfilePublic);
router.get(
  "/:steam_id/statistics",
  parseQueryFilterParams,
  getPlayerDetailsWithStatsController
);
router.get(
  "/:steam_id/app/:app_id/hours",
  validateNumericParams(["app_id"]),
  getPlayerSteamAppIdHours
);
router.get(
  "/:steam_id/app/:app_id/rank",
  validateNumericParams(["app_id"]),
  getPlayerSteamAppIdRank
);
router.get("/:steam_id/platform/:platform/rank", getPlayerPlatformRank);
// router.get(
//   "/:season_id/:map_id/:league_id/:stage/:team_id/leaderboards",
//   parseQueryParams,
//   getMultipleLeaderboardsController
// );
// router.get(
//   "/:season_id/:map/:league_id/:stage/:team_id/:leaderboard",
//   parseQueryParams,
//   getPlayerLeaderboardController
// );
// router.get(
//   "/:season_id/:map/:league_id/:stage/:team_id",
//   parseQueryParams,
//   getPlayersByFiltersController
// );

export default router;
