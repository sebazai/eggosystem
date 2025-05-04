import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  type Map,
  type MatchGame,
  type RequestWithParams
} from "@eggosystem/types";
import { runQuery } from "../../db/mysqlRunQuery";
import {
  getMatchGameTeamRoundBreakdownController,
  getGameRoundInfoController
} from "../../controllers/games.controllers";

const router = Router();

router.get(
  "/:game_id",
  validateNumericParams(),
  async (req: RequestWithParams<{ game_id: string }>, res) => {
    const gameId = Number(req.params.game_id);
    const [game] = await runQuery<
      Array<
        | {
            map_order: MatchGame["map_order"];
            map_id: MatchGame["map_id"];
            name: Map["name"];
          }
        | undefined
      >
    >(
      "SELECT mg.map_order, mg.map_id, m.name FROM MatchGames mg JOIN Maps m ON mg.map_id = m.id WHERE mg.id = ?",
      [gameId]
    );
    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }
    res.json(game);
  }
);

router.get(
  "/:game_id/breakdown",
  validateNumericParams(),
  getMatchGameTeamRoundBreakdownController
);
router.get(
  "/:game_id/roundinfo",
  validateNumericParams(),
  getGameRoundInfoController
);

export default router;
