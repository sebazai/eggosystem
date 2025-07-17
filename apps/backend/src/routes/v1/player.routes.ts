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

// New Router instance
const router = Router();

// Player routes
router.get("/:steam_id", getPlayerBySteamIdController);
router.get("/:steam_id/details", getPlayerDetailsBySteamIdController);
router.get("/:steam_id/public", getIsPlayerProfilePublic);

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
router.get("/:steam_id/kanarank", getPlayerKanaRankController);
router.get(
  "/:steam_id/latest-season-stats",
  getPlayerStatsForLatestSeasonController
);
router.get("/:steam_id/oldkanaelo", getPlayerOldKanaEloController);

// Protected route for setting kanaelo - requires API key authentication
router.post(
  "/:steam_id/set-kanaelo",
  createApiKeyValidator(process.env.BACKEND_SERVICE_API_KEY),
  setPlayerKanaEloController
);

export default router;
