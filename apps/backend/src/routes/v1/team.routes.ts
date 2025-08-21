import { Router } from "express";
import {
  getAllTeams,
  getTeamByIdController,
  getTeamsWithoutOrgController
} from "../../controllers/teams.controllers";
import {
  getAllTeamCaptainsController,
  getTeamCaptainsBySeasonIdController,
  getTeamCaptainsForActiveSeasonController
} from "../../controllers/team-captains.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

// Regular team routes
router.get("/", getAllTeams);
router.get("/org-missing", getTeamsWithoutOrgController);

// Team captains routes
router.get("/captains", getAllTeamCaptainsController);
router.get("/season/active/captains", getTeamCaptainsForActiveSeasonController);
router.get(
  "/season/:season_id/captains",
  validateNumericParams(["season_id"]),
  getTeamCaptainsBySeasonIdController
);

// This needs to be last as it's a catch-all for team_id
router.get(
  "/:team_id",
  validateNumericParams(["team_id"]),
  getTeamByIdController
);

export default router;
