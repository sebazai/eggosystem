import { Router } from "express";
import {
  getPublicGameWideMarketingSponsorsByAbbrevController,
  getPublicMarketingSponsorsController
} from "../../controllers/public-marketing-sponsors.controllers";

const router = Router();

router.get(
  "/games/:game_abbreviation",
  getPublicGameWideMarketingSponsorsByAbbrevController
);
router.get("/", getPublicMarketingSponsorsController);

export default router;
