import { Router } from "express";
import {
  getOrgs,
  getOrgById,
  getOrgTeams
} from "../../controllers/organizations.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.get("/", getOrgs);
router.get("/:id", validateNumericParams(), getOrgById);
router.get("/:id/teams", validateNumericParams(), getOrgTeams);

export default router;
