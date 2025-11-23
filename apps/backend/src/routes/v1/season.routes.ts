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
import { getFantasyPlayersByLeagueController } from "../../controllers/fantasy.controllers";

const router = Router();

router.get("/", getSeasonsController);
router.get("/:id", validateNumericParams(), getSeasonByIdController);
router.get(
  "/:id/details",
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

router.get(
  "/:season_id/fantasy/leagues/:league_id/players",
  validateNumericParams(),
  getFantasyPlayersByLeagueController
);

export default router;
