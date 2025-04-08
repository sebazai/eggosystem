import { Router } from "express";
import {
  getPlayerBySteamIdController,
  getIsPlayerProfilePublic
  // getPlayersByFiltersController,
  // getPlayerLeaderboardController,
  // getMultipleLeaderboardsController
} from "../../controllers/players.controllers";

// import parseQueryParams from "../../middlewares/parseQueryParams";

// New Router instance
const router = Router();

// Player routes
router.get("/:steam_id/details", getPlayerBySteamIdController);
router.get("/:steam_id/public", getIsPlayerProfilePublic);
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
