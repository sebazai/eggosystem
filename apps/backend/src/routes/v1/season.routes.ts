import { Router } from "express";
import {
  fetchSeasons,
  fetchSeasonById,
  fetchSeasonDetailsById,
  addSignupForSeason
} from "../../controllers/seasons.controllers";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", fetchSeasons);
router.get("/:id", fetchSeasonById);
router.get("/:id/details", fetchSeasonDetailsById);
router.post("/:id/signup", authenticateJWT, addSignupForSeason);

export default router;
