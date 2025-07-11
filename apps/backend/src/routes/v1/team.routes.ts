import { Router } from "express";
import {
  getAllTeams,
  getTeamByIdController,
  getTeamsWithoutOrgController
} from "../../controllers/teams.controllers";
import { getTeamEnhancedMapStatsController } from "../../controllers/team-map-stats.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";

const router = Router();

router.get("/", getAllTeams);
router.get("/org-missing", getTeamsWithoutOrgController);
router.get(
  "/:teamId",
  validateNumericParams(["teamId"]),
  getTeamByIdController
);

// GET /api/v1/teams/:teamId/enhanced-map-stats
router.get(
  "/:teamId/enhanced-map-stats",
  validateNumericParams(["teamId"]),
  parseQueryFilterParams,
  getTeamEnhancedMapStatsController
);

export default router;
