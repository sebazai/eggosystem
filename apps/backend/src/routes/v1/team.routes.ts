import { Router } from "express";
import {
  getAllTeams,
  getTeamsByFiltersController,
  getTeamDetailsController,
  getTopTeamsController
} from "../../controllers/teams.controllers";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.get("/filtered", parseQueryFilterParams, getTeamsByFiltersController);
router.get("/", getAllTeams);
router.get("/topteams", parseQueryFilterParams, getTopTeamsController);
router.get(
  "/:teamId",
  parseQueryFilterParams,
  validateNumericParams(),
  getTeamDetailsController
);

export default router;
