import { Router } from "express";
import {
  getSeasonsController,
  getSeasonByIdController,
  getSeasonDetailsByIdController,
  getFaceitLinksForSeasonController,
  getTeamCaptainsBySeasonIdController
} from "../../controllers/seasons.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import { getLeaguesBySeasonController } from "../../controllers/caster.controllers";
import {
  authenticateJWT,
  checkJWTPermissions
} from "../../middlewares/auth.middleware";
import {
  getFantasyPlayersByLeagueController,
  createFantasyTeamController,
  getMyFantasyTeamController,
  getFantasyTeamBySteamIdController,
  substitutePlayerController,
  updatePlayerRolesController,
  getFantasyLeaderboardController,
  getFantasyOverallLeaderboardController,
  getFantasyPriceHistoryController,
  seedInitialPlayerValuesController,
  getTopPerformingPlayersController,
  getPlayerPointHistoryController
} from "../../controllers/fantasy.controllers";

const router = Router();

router.get("/", getSeasonsController);
router.get("/:season_id", validateNumericParams(), getSeasonByIdController);
router.get(
  "/:season_id/details",
  validateNumericParams(),
  getSeasonDetailsByIdController
);
router.get(
  "/:season_id/leagues",
  validateNumericParams(),
  getLeaguesBySeasonController
);
router.get(
  "/:season_id/faceit-links",
  validateNumericParams(),
  authenticateJWT,
  getFaceitLinksForSeasonController
);

router.get(
  "/:season_id/captains",
  validateNumericParams(),
  authenticateJWT,
  checkJWTPermissions({
    fallbackRoles: ["admin", "captain", "helpdesk", "caster"]
  }),
  getTeamCaptainsBySeasonIdController
);

// Fantasy League Routes
router.get(
  "/:season_id/fantasy/leagues/:league_id/players",
  validateNumericParams(),
  getFantasyPlayersByLeagueController
);

router.post(
  "/:season_id/fantasy/teams",
  validateNumericParams(),
  authenticateJWT,
  createFantasyTeamController
);

router.get(
  "/:season_id/fantasy/teams/me",
  validateNumericParams(),
  authenticateJWT,
  getMyFantasyTeamController
);

router.get(
  "/:season_id/fantasy/teams/:steam_id",
  validateNumericParams(),
  getFantasyTeamBySteamIdController
);

router.put(
  "/:season_id/fantasy/teams/me/players",
  validateNumericParams(),
  authenticateJWT,
  substitutePlayerController
);

router.put(
  "/:season_id/fantasy/teams/me/roles",
  validateNumericParams(),
  authenticateJWT,
  updatePlayerRolesController
);

router.get(
  "/:season_id/fantasy/leagues/:league_id/leaderboard",
  validateNumericParams(),
  getFantasyLeaderboardController
);

router.get(
  "/:season_id/fantasy/overall-leaderboard",
  validateNumericParams(),
  getFantasyOverallLeaderboardController
);

router.get(
  "/:season_id/fantasy/leagues/:league_id/price-history",
  validateNumericParams(),
  getFantasyPriceHistoryController
);

router.get(
  "/:season_id/fantasy/leagues/:league_id/top-players",
  validateNumericParams(),
  getTopPerformingPlayersController
);

router.get(
  "/:season_id/fantasy/teams/me/players/:player_id/points",
  validateNumericParams(),
  authenticateJWT,
  getPlayerPointHistoryController
);

router.post(
  "/:season_id/fantasy/leagues/:league_id/seed-values",
  validateNumericParams(),
  authenticateJWT,
  seedInitialPlayerValuesController
);

export default router;
