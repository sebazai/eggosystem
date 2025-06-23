import { Router } from "express";
import {
  getKanahautomoOrganizationStatus,
  registerForKanahautomoWithOrganization
} from "../../controllers/kanahautomo.controllers";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/organization-status", getKanahautomoOrganizationStatus);
router.post(
  "/register-with-organization",
  authenticateJWT,
  registerForKanahautomoWithOrganization
);

export default router;
