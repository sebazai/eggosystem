import { Router } from "express";
import {
  getFlaggedMatchesController,
  getManualTeamGameScoresController,
  putManualTeamGameScoresController
} from "../../../controllers/dashboard/matches.controllers";

const router = Router();

router.get("/flagged", getFlaggedMatchesController);

router.get(
  "/games/:match_game_id/team-game-scores",
  getManualTeamGameScoresController
);
router.put(
  "/games/:match_game_id/team-game-scores",
  putManualTeamGameScoresController
);
router.patch(
  "/games/:match_game_id/team-game-scores",
  putManualTeamGameScoresController
);

export default router;
