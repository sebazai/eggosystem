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
import {
  getMatchGamesByExternalMatchRoomId,
  getMatchIdByGameId
} from "../../models/match-game.models";

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
  "/:match_game_id/match",
  validateNumericParams(),
  async (req: RequestWithParams<{ match_game_id: string }>, res, next) => {
    const matchGameId = Number(req.params.match_game_id);
    const [result] = await getMatchIdByGameId(matchGameId);
    if (!result) {
      return next(new NotFoundError("Game not found"));
    }
    res.json({ match_id: result.match_id });
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
router.get("/external/:external_match_room_id/games", async (req, res) => {
  const externalMatchRoomId = req.params.external_match_room_id;
  const games = await getMatchGamesByExternalMatchRoomId(externalMatchRoomId);
  res.json(games);
});

export default router;
