import { Router } from "express";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import {
  getGamesController,
  getGameTypesController,
  getGameTypesByGameIdController
} from "../../controllers/games.controllers";

const router = Router();

// List all games
router.get("/games", getGamesController);

// List all game types
router.get("/types", getGameTypesController);

// List game types for a specific game
router.get(
  "/:gameId/types",
  validateNumericParams(),
  getGameTypesByGameIdController
);

export default router;
