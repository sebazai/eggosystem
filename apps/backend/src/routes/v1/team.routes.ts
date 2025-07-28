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
  "/league/:leagueId",
  validateNumericParams(["leagueId"]),
  getTeamsByLeagueController
);
router.get(
  "/:teamId",
  validateNumericParams(["teamId"]),
  getTeamByIdController
);
router.get(
  "/:teamId/keyplayers",
  validateNumericParams(["teamId"]),
  getTeamKeyPlayersController
);
router.get(
  "/:teamId/players",
  validateNumericParams(["teamId"]),
  getTeamPlayersController
);

export default router;
