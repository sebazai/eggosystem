import { Router } from "express";
import {
  getSeasonsController,
  getSeasonByIdController,
  getSeasonDetailsByIdController,
  getFaceitLinksForSeasonController
} from "../../controllers/seasons.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import { getLeaguesBySeasonController } from "../../controllers/caster.controllers";

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
router.get("/:season_id/faceit-links", getFaceitLinksForSeasonController);

export default router;
