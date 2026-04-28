import { Router } from "express";
import {
  deleteMatchTeamMapVetoesController,
  getFlaggedMatchesController,
  getManualTeamGameScoresController,
  putManualTeamGameScoresController
} from "../../../controllers/dashboard/matches.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";

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

router.delete(
  "/:match_id/vetoes",
  validateNumericParams(["match_id"]),
  deleteMatchTeamMapVetoesController
);

export default router;
