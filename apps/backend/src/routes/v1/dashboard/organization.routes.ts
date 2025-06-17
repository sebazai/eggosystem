import { Router } from "express";
import { getOrgs } from "../../../controllers/organizations.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";
import { getOrganizationTeamsController } from "../../../controllers/dashboard/organizations.controllers";

const router = Router();

router.get("/", getOrgs);
router.get(
  "/:id/teams",
  validateNumericParams(),
  getOrganizationTeamsController
);

export default router;
