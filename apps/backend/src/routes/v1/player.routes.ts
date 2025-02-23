import { Router } from "express";
import {
  getPlayersController,
  getPlayerBySteamIdController,
  getPlayersByFiltersController,
  getPlayerLeaderboardController,
  getMultipleLeaderboardsController
} from "../../controllers/players.controllers";

import parseParams from "../../middlewares/parseParams";

// New Router instance
const router = Router();

// Player routes
router.get("/", getPlayersController);
router.get("/:steam_id", getPlayerBySteamIdController);
router.get(
  "/:season_id/:map_id/:league_id/:stage/:team_id/leaderboards",
  parseParams,
  getMultipleLeaderboardsController
);
router.get(
  "/:season_id/:map/:league_id/:stage/:team_id/:leaderboard",
  parseParams,
  getPlayerLeaderboardController
);
router.get(
  "/:season_id/:map/:league_id/:stage/:team_id",
  parseParams,
  getPlayersByFiltersController
);

export default router;
