import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  type Map,
  type MatchGame,
  type RequestWithParams
} from "@eggosystem/types";
import { runQuery } from "../../db/mysqlRunQuery";
import {
  getGameTeamRoundBreakdownController,
  getGameRoundInfoController,
  getGameTeamStatsController,
  getGamePlayerStatsController,
  getGameTopPlayersController,
  getGameClipController
} from "../../controllers/match-games.controllers";

import { NotFoundError } from "../../utils/errors";

const router = Router();

router.get(
  "/:match_game_id",
  validateNumericParams(),
  async (req: RequestWithParams<{ match_game_id: string }>, res, next) => {
    const matchGameId = Number(req.params.match_game_id);
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
      [matchGameId]
    );
    if (!game) {
      return next(new NotFoundError("Game not found"));
    }
    res.json(game);
  }
);

router.get(
  "/:match_game_id/topplayers",
  validateNumericParams(),
  getGameTopPlayersController
);
router.get(
  "/:match_game_id/breakdown",
  validateNumericParams(),
  getGameTeamRoundBreakdownController
);
router.get(
  "/:match_game_id/roundinfo",
  validateNumericParams(),
  getGameRoundInfoController
);
router.get(
  "/:match_game_id/teamstats",
  validateNumericParams(),
  getGameTeamStatsController
);
router.get(
  "/:match_game_id/playerstats",
  validateNumericParams(),
  getGamePlayerStatsController
);
router.get(
  "/:match_game_id/clip",
  validateNumericParams(),
  getGameClipController
);

export default router;
