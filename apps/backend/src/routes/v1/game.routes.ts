import { Router } from "express";
import {
  getGameTypesByGameIdController,
  getGameTypesController,
  getGamesController
} from "../../controllers/games.controllers";

const router = Router();

router.get("/", getGamesController);
router.get("/types", getGameTypesController);
router.get("/:gameId/types", getGameTypesByGameIdController);

export default router;
