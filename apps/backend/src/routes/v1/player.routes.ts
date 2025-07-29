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
  setPlayerKanaEloController
} from "../../controllers/players.controllers";
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

export default router;
