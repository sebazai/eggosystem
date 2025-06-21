import { Router } from "express";
import {
  getKanahautomoOrganizationStatus,
  registerForKanahautomoWithOrganization
} from "../../controllers/kanahautomo.controllers";

const router = Router();

router.get("/organization-status", getKanahautomoOrganizationStatus);
router.post(
  "/register-with-organization",
  registerForKanahautomoWithOrganization
);

export default router;
