import { Router } from "express";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";
import {
  getAllCasterApplicationsController,
  getPendingCountController,
  approveCasterApplicationController,
  rejectCasterApplicationController
} from "../../../controllers/caster-applications.controllers";

const router = Router();

router.get("/pending-count", getPendingCountController);

router.get("/", getAllCasterApplicationsController);

router.post(
  "/:id/approve",
  validateNumericParams(["id"]),
  approveCasterApplicationController
);

router.post(
  "/:id/reject",
  validateNumericParams(["id"]),
  rejectCasterApplicationController
);

export default router;
