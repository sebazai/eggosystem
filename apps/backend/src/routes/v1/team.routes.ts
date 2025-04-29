import { Router } from "express";
import {
  getAllTeams,
  getTeamsByFiltersController,
  getTeamDetailsController,
  getTopTeamsController,
  getTeamByIdController,
  getTeamsWithoutOrgController
} from "../../controllers/teams.controllers";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.get("/filtered", parseQueryFilterParams, getTeamsByFiltersController);
router.get("/", getAllTeams);
router.get("/org-missing", getTeamsWithoutOrgController);
router.get("/topteams", parseQueryFilterParams, getTopTeamsController);
router.get("/:teamId", validateNumericParams(), getTeamByIdController);
router.get(
  "/:teamId/details",
  parseQueryFilterParams,
  validateNumericParams(),
  getTeamDetailsController
);

export default router;
