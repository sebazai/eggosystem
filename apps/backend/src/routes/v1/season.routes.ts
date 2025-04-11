import { Router } from "express";
import {
  getSeasonsController,
  getSeasonByIdController,
  getSeasonDetailsByIdController,
  addSignupForSeason,
  getActiveSeasonForApp
} from "../../controllers/seasons.controllers";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", getSeasonsController);
router.get("/:id", getSeasonByIdController);
router.get("/:id/details", getSeasonDetailsByIdController);
router.post("/:id/signup", authenticateJWT, addSignupForSeason);
router.get("/app/:app_id/active", getActiveSeasonForApp);

export default router;
