import { Router } from "express";
import {
  getMatchesController,
  getMatchPlayerStatsController,
  getMatchTeamStatsController,
  getMatchTopPlayersController,
  getMatchGamesController,
  getMatchInfoController,
  getMatchController,
  getMatchGameController,
  getMatchMapVetoesController,
  getMatchBreadcrumbController
} from "../../controllers/matches.controllers";
import {
  reserveStreamController,
  unreserveStreamController
} from "../../controllers/match-streams.controllers";

import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  authenticateJWT,
  checkJWTPermissions
} from "../../middlewares/auth.middleware";

// New Router instance
const router = Router();

router.get("/:match_id", validateNumericParams(), getMatchController);
router.get(
  "/:match_id/breadcrumb",
  validateNumericParams(),
  getMatchBreadcrumbController
);
router.get("/:match_id/info", validateNumericParams(), getMatchInfoController);
router.get(
  "/:match_id/games/:game_id",
  validateNumericParams(),
  getMatchGameController
);
router.get(
  "/:match_id/mapsplayed",
  validateNumericParams(),
  getMatchGamesController
);
router.get(
  "/:match_id/playerstats",
  validateNumericParams(),
  getMatchPlayerStatsController
);

router.get(
  "/:match_id/teamstats",
  validateNumericParams(),
  getMatchTeamStatsController
);
router.get(
  "/:match_id/topplayers",
  validateNumericParams(),
  getMatchTopPlayersController
);

router.get(
  "/:match_id/vetoes",
  validateNumericParams(),
  getMatchMapVetoesController
);

router.get("/", getMatchesController);

// Stream reservation routes (require authentication and caster role)
router.post(
  "/:match_id/reserve-cast",
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["caster"] }),
  validateNumericParams(),
  reserveStreamController
);

router.delete(
  "/:match_id/reserve-cast",
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["caster"] }),
  validateNumericParams(),
  unreserveStreamController
);

export default router;
