import { Router } from "express";
import {
  getAllTeams,
  getTeamsByFiltersController,
  getTeamDetailsController
} from "../../controllers/teams.controllers";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";

const router = Router();

router.get("/filtered", parseQueryFilterParams, getTeamsByFiltersController);
router.get("/", getAllTeams);
router.get("/:teamId", parseQueryFilterParams, getTeamDetailsController);

export default router;
