import { Router } from "express";
import { validateAllSeasonChampionships } from "../../../controllers/dashboard/faceit-validation.controllers";

const router = Router();

// Validate rosters for ALL championships in a season
router.get(
  "/seasons/:seasonId/roster-comparison",
  validateAllSeasonChampionships
);

export default router;
