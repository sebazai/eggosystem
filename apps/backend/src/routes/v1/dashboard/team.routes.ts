import { Router } from "express";
import { getAllTeams } from "../../../controllers/teams.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";
import { getTeamOrganizationController } from "../../../controllers/dashboard/teams.controllers";

const router = Router();

router.get("/", getAllTeams);
router.get(
  "/:id/organization",
  validateNumericParams(),
  getTeamOrganizationController
);

export default router;
