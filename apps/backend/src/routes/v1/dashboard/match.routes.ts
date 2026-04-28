import { Router } from "express";
import {
  deleteMatchTeamMapVetoesController,
  getFlaggedMatchesController,
  getManualTeamGameScoresController,
  getUnfinishedMatchesController,
  putManualTeamGameScoresController
} from "../../../controllers/dashboard/matches.controllers";
import { createMatchVetoStepsController } from "../../../controllers/dashboard/match-vetoes.controllers";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";

const router = Router();

router.get("/unfinished/:season_id", getUnfinishedMatchesController);
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

router.post("/:match_id/vetoes", createMatchVetoStepsController);
router.delete(
  "/:match_id/vetoes",
  validateNumericParams(["match_id"]),
  deleteMatchTeamMapVetoesController
);

export default router;
