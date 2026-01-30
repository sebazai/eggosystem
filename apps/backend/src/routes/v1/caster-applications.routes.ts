import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  getMyCasterApplicationsController,
  getAllCasterApplicationsController,
  getPendingCountController,
  approveCasterApplicationController,
  rejectCasterApplicationController
} from "../../controllers/caster-applications.controllers";
import { checkJWTPermissions } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/me", getMyCasterApplicationsController);

router.get(
  "/pending-count",
  checkJWTPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
  getPendingCountController
);

router.get(
  "/",
  checkJWTPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
  getAllCasterApplicationsController
);

router.post(
  "/:id/approve",
  checkJWTPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
  validateNumericParams(["id"]),
  approveCasterApplicationController
);

router.post(
  "/:id/reject",
  checkJWTPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
  validateNumericParams(["id"]),
  rejectCasterApplicationController
);

export default router;
