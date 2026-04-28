import { Router } from "express";
import {
  getFlaggedMatchesController,
  getManualTeamGameScoresController,
  getMatchVetoContextController,
  getUnfinishedMatchesController,
  putManualTeamGameScoresController
} from "../../../controllers/dashboard/matches.controllers";

const router = Router();

router.get("/unfinished/:season_id", getUnfinishedMatchesController);
router.get("/flagged", getFlaggedMatchesController);
router.get("/:match_id/veto-context", getMatchVetoContextController);

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
