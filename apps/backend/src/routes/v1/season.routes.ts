import { Router } from "express";
import {
  getSeasonsController,
  getSeasonByIdController,
  getSeasonDetailsByIdController
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

export default router;
