import { Router } from "express";
import { getPlayoffBracketController } from "../../controllers/playoff.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.get(
  "/seasons/:season_id/leagues/:league_id/bracket",
  validateNumericParams(["season_id", "league_id"]),
  getPlayoffBracketController
);

export default router;
