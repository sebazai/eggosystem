import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  getActiveSeasonForApp,
  getActiveSignupOrActiveSeasonForAppController,
  getActiveSignupSeasonForApp
} from "../../controllers/organizer.controllers";

const router = Router();

router.get(
  "/:organizer_id/app/:app_id/active-season",
  validateNumericParams(),
  getActiveSeasonForApp
);

router.get(
  "/:organizer_id/app/:app_id/signup-open",
  validateNumericParams(),
  getActiveSignupSeasonForApp
);

router.get(
  "/:organizer_id/app/:app_id/active-signup",
  validateNumericParams(),
  getActiveSignupOrActiveSeasonForAppController
);

export default router;
