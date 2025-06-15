import { Router } from "express";
import {
  getAllTeams,
  getTeamOrganizationController
} from "../../../controllers/teams.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";

const router = Router();

router.get("/", getAllTeams);
router.get(
  "/:id/organization",
  validateNumericParams(),
  getTeamOrganizationController
);

export default router;
