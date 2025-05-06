import { Router } from "express";
import {
  getAllTeams,
  getTeamByIdController,
  getTeamsWithoutOrgController
} from "../../controllers/teams.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.get("/", getAllTeams);
router.get("/org-missing", getTeamsWithoutOrgController);
router.get("/:teamId", validateNumericParams(), getTeamByIdController);

export default router;
