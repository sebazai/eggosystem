import { Router } from "express";
import {
  getFaceitLeaguesController,
  getStandingsController,
  getStandingsTeamsExternalIdController
} from "../../controllers/standings.controllers";

const router = Router();

router.get("/leagues", getFaceitLeaguesController);
router.get("/:faceit_league_id", getStandingsController);
router.get("/teams/:team_id", getStandingsTeamsExternalIdController);

export default router;
