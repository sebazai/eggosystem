import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  getActiveSeasonForApp,
  getActiveSignupOrActiveSeasonForAppController,
  getActiveSignupSeasonForApp
} from "../../controllers/organizer.controllers";

const router = Router();

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
