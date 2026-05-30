import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  getFlashLeaderboardController,
  getRoundImpactLeaderboardController,
  getUtilityDisciplineLeaderboardController
} from "../../controllers/leaderboard.controllers";

const router = Router();

router.get(
  "/:tournament_id/leaderboards/flash",
  validateNumericParams(["tournament_id"]),
  getFlashLeaderboardController
);

router.get(
  "/:tournament_id/leaderboards/round-impact",
  validateNumericParams(["tournament_id"]),
  getRoundImpactLeaderboardController
);

router.get(
  "/:tournament_id/leaderboards/utility-discipline",
  validateNumericParams(["tournament_id"]),
  getUtilityDisciplineLeaderboardController
);

export default router;
