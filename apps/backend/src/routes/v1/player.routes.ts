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
  getPlayerSkillDiagramController,
  getMultiplePlayersSkillDiagramController,
  getFilteredPlayerGameDetailsController,
  getFilteredPlayerMatchHistoryController,
  getFilteredPlayerStatisticsController,
  getFilteredPlayerTeamDetailsController
} from "../../controllers/players.controllers";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

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
router.get(
  "/:steam_id/skill-diagram",
  parseQueryFilterParams,
  getPlayerSkillDiagramController
);
router.get(
  "/skill-diagram/aggregate",
  parseQueryFilterParams,
  getMultiplePlayersSkillDiagramController
);

router.get(
  "/:steam_id/match-history",
  parseQueryFilterParams,
  getFilteredPlayerMatchHistoryController
);

router.get(
  "/:steam_id/statistics",
  parseQueryFilterParams,
  getFilteredPlayerStatisticsController
);

router.get(
  "/:steam_id/game-details",
  parseQueryFilterParams,
  getFilteredPlayerGameDetailsController
);

router.get(
  "/:steam_id/team-details",
  parseQueryFilterParams,
  getFilteredPlayerTeamDetailsController
);

export default router;
