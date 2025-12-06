import { Router } from "express";
import {
  getPlayerDetailsBySteamIdController,
  getPlayerBySteamIdController,
  getIsPlayerProfilePublic,
  getPlayerSteamAppIdHours,
  getPlayerSteamAppIdRank,
  getPlayerPlatformRank,
  getPlayerKanaRankController,
  getPlayerOldKanaEloController,
  getPlayerStatsForLatestSeasonController,
  setPlayerKanaEloController,
  getPlayerHistoricalDataController,
  getPlayerHistoricalAverageByRankController,
  getPlayerHistoricalAverageByLevelController,
  getPlayerHistoricalAverageController,
  resolveSteamIdController
} from "../../controllers/players.controllers";
import { getPlayerTrophiesController } from "../../controllers/trophies.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import { createApiKeyValidator } from "../../middlewares/api-key-auth.middleware";
import { corsMiddleware } from "../../middlewares/cors.middleware";

// New Router instance
const router = Router();

// Player routes
router.get("/:steam_id", getPlayerBySteamIdController);
router.get(
  "/:steam_id/details",
  corsMiddleware,
  getPlayerDetailsBySteamIdController
);
router.get("/:steam_id/public", getIsPlayerProfilePublic);

// Resolve Steam ID endpoint - supports SteamID64, SteamID, SteamID3, and custom URLs
router.get("/resolve/:steam_id", corsMiddleware, resolveSteamIdController);

router.get(
  "/:steam_id/app/:app_id/hours",
  corsMiddleware,
  validateNumericParams(["app_id"]),
  getPlayerSteamAppIdHours
);
router.get(
  "/:steam_id/app/:app_id/rank",
  corsMiddleware,
  validateNumericParams(["app_id"]),
  getPlayerSteamAppIdRank
);
router.get(
  "/:steam_id/platform/:platform/rank",
  corsMiddleware,
  getPlayerPlatformRank
);
router.get("/:steam_id/kanarank", corsMiddleware, getPlayerKanaRankController);
router.get("/:steam_id/trophies", corsMiddleware, getPlayerTrophiesController);
router.get(
  "/:steam_id/latest-season-stats",
  corsMiddleware,
  getPlayerStatsForLatestSeasonController
);
router.get(
  "/:steam_id/oldkanaelo",
  corsMiddleware,
  getPlayerOldKanaEloController
);

// Protected route for setting kanaelo - requires API key authentication
router.post(
  "/:steam_id/set-kanaelo",
  createApiKeyValidator(process.env.BACKEND_SERVICE_API_KEY),
  setPlayerKanaEloController
);

// Historical data route
router.get(
  "/:steam_id/historical-data",
  corsMiddleware,
  getPlayerHistoricalDataController
);

// Historical average routes
router.get(
  "/historical/rank/:rank",
  corsMiddleware,
  validateNumericParams(["rank"]),
  getPlayerHistoricalAverageByRankController
);

router.get(
  "/historical/level/:level",
  corsMiddleware,
  validateNumericParams(["level"]),
  getPlayerHistoricalAverageByLevelController
);

router.get(
  "/historical/avg",
  corsMiddleware,
  getPlayerHistoricalAverageController
);

export default router;
