import { Router } from "express";
import {
  getAllTeams,
  getTeamByIdController,
  getTeamsWithoutOrgController,
  getTeamKeyPlayersController,
  getTeamPlayersController,
  getTeamsByLeagueController
} from "../../controllers/teams.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.get("/", getAllTeams);
router.get("/org-missing", getTeamsWithoutOrgController);
router.get(
  "/league/:league_id",
  validateNumericParams(["league_id"]),
  getTeamsByLeagueController
);
router.get(
  "/:team_id",
  validateNumericParams(["team_id"]),
  getTeamByIdController
);
router.get(
  "/:team_id/keyplayers",
  validateNumericParams(["team_id"]),
  getTeamKeyPlayersController
);
router.get(
  "/:team_id/players",
  validateNumericParams(["team_id"]),
  getTeamPlayersController
);

export default router;
