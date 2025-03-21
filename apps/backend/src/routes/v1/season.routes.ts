import { Router } from "express";
import {
  fetchSeasons,
  fetchSeasonById,
  addSignupForSeason
} from "../../controllers/seasons.controllers";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/", fetchSeasons);
router.get("/:id", fetchSeasonById);
router.post("/:id/signup", authenticateJWT, addSignupForSeason);

export default router;
