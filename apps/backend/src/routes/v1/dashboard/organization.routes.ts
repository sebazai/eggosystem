import { Router } from "express";
import {
  getOrgs,
  getOrganizationTeamsController
} from "../../../controllers/organizations.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";

const router = Router();

router.get("/", getOrgs);
router.get(
  "/:id/teams",
  validateNumericParams(),
  getOrganizationTeamsController
);

export default router;
