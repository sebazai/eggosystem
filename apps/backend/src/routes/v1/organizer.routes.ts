import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  getActiveSeasonForApp,
  getActiveSignupOrActiveSeasonForAppController,
  getActiveSignupSeasonForApp,
  getOrganizerByIdPublic
} from "../../controllers/organizer.controllers";
import {
  getOrganizersWithCasterApplicationsController,
  submitCasterApplicationController,
  getCasterApplicationsByOrganizerController
} from "../../controllers/caster-applications.controllers";
import {
  authenticateJWT,
  checkJWTPermissions
} from "../../middlewares/auth.middleware";

const router = Router();

router.get(
  "/with-caster-applications",
  authenticateJWT,
  getOrganizersWithCasterApplicationsController
);

router.get(
  "/:organizer_id",
  validateNumericParams(["organizer_id"]),
  getOrganizerByIdPublic
);

router.post(
  "/:organizer_id/caster-applications",
  authenticateJWT,
  validateNumericParams(["organizer_id"]),
  submitCasterApplicationController
);

router.get(
  "/:organizer_id/caster-applications",
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
  validateNumericParams(["organizer_id"]),
  getCasterApplicationsByOrganizerController
);

router.get(
  "/:organizer_id/app/:app_id/seasons/active",
  validateNumericParams(),
  getActiveSeasonForApp
);

router.get(
  "/:organizer_id/app/:app_id/seasons/signup-open",
  validateNumericParams(),
  getActiveSignupSeasonForApp
);

router.get(
  "/:organizer_id/app/:app_id/seasons/active-signup-open",
  validateNumericParams(),
  getActiveSignupOrActiveSeasonForAppController
);

export default router;
