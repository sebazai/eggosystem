import { Router } from "express";
import {
  getAllTeams,
  getTeamByIdController,
  getTeamsWithoutOrgController
} from "../../controllers/teams.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

// Regular team routes
router.get("/", getAllTeams);
router.get("/org-missing", getTeamsWithoutOrgController);

router.get(
  "/:team_id",
  validateNumericParams(["team_id"]),
  getTeamByIdController
);

export default router;
