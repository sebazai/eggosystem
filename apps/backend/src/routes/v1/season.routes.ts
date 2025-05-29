import { Router } from "express";
import {
  getSeasonsController,
  getSeasonByIdController,
  getSeasonDetailsByIdController,
  getActiveSeasonForApp,
  getActiveSignupSeasonForApp
} from "../../controllers/seasons.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.get("/", getSeasonsController);
router.get("/:id", validateNumericParams(), getSeasonByIdController);
router.get(
  "/:id/details",
  validateNumericParams(),
  getSeasonDetailsByIdController
);
router.get(
  "/app/:app_id/active",
  validateNumericParams(),
  getActiveSeasonForApp
);

router.get(
  "/app/:app_id/signup-open",
  validateNumericParams(),
  getActiveSignupSeasonForApp
);

export default router;
