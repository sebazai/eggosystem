import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  getActiveSeasonForApp,
  getActiveSignupOrActiveSeasonForAppController,
  redirectToActiveSignup
} from "../../controllers/organizer.controllers";

const router = Router();

router.get(
  "/:organizer_id/app/:app_id/seasons/active",
  validateNumericParams(),
  getActiveSeasonForApp
);

router.get(
  "/:organizer_id/app/:app_id/seasons/active-signup-open",
  validateNumericParams(),
  getActiveSignupOrActiveSeasonForAppController
);

router.get(
  "/:organizer_id/app/:app_id/signup-redirect",
  validateNumericParams(),
  redirectToActiveSignup
);

export default router;
