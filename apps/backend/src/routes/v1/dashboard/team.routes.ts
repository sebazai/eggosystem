import { Router } from "express";
import {
  getAllTeams,
  getTeamByIdController
} from "../../../controllers/teams.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";
import { getTeamOrganizationController } from "../../../controllers/dashboard/teams.controllers";

const router = Router();

router.get("/", getAllTeams);
router.get(
  "/:id/organization",
  validateNumericParams(),
  getTeamOrganizationController
);
router.get("/:team_id", getTeamByIdController);

export default router;
