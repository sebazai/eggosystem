import { Router } from "express";
import {
  getAllTeams,
  getTeamByIdController
} from "../../../controllers/teams.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";
import {
  getTeamOrganizationController,
  getTeamPlayersController
} from "../../../controllers/dashboard/teams.controllers";

const router = Router();

router.get("/", getAllTeams);
router.get(
  "/:id/organization",
  validateNumericParams(),
  getTeamOrganizationController
);
// GET /api/v1/dashboard/teams/season/:season_id/team/:team_id/players
router.get(
  "/season/:season_id/team/:team_id/players",
  validateNumericParams(),
  getTeamPlayersController
);
router.get("/:team_id", getTeamByIdController);

export default router;
