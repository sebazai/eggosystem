import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import { getTeamPistolWinsController } from "../../controllers/pistol-wins.controllers";
import { getTeamPlantStatsController } from "../../controllers/plant-stats.controllers";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";

const router = Router();

// Route to get pistol win statistics for a specific team
router.get(
  "/teams/:teamId/pistol-wins",
  validateNumericParams(),
  parseQueryFilterParams,
  getTeamPistolWinsController
);

// Route to get plant statistics for a specific team
router.get(
  "/teams/:teamId/plant-stats",
  validateNumericParams(),
  parseQueryFilterParams,
  getTeamPlantStatsController
);

export default router;
