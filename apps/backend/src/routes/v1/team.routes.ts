import { Router } from "express";
import {
  getAllTeams,
  getTeamsByFiltersController,
  getTeamDetailsController
} from "../../controllers/teams.controllers";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";

const router = Router();

// Route for filtered teams data
router.get("/filtered", parseQueryFilterParams, getTeamsByFiltersController);

// Default route for all teams
router.get("/", getAllTeams);

// Route for getting detailed team info by ID (must come after other specific routes)
router.get("/:teamId", parseQueryFilterParams, getTeamDetailsController);

export default router;
