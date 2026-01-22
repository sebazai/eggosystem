import { Router } from "express";
import { validateAllSeasonChampionships } from "../../../controllers/dashboard/faceit-validation.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";

const router = Router();

// Validate rosters for ALL championships in a season
router.get(
  "/seasons/:season_id/roster-comparison",
  validateNumericParams(),
  validateAllSeasonChampionships
);

export default router;
