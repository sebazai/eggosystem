import { Router } from "express";
import {
  getPlayerLeaderboardController,
  getMultipleLeaderboardsController
} from "../../controllers/players.controllers";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";

const router = Router();

router.get("/", parseQueryFilterParams, getPlayerLeaderboardController);

router.get(
  "/multiple",
  parseQueryFilterParams,
  getMultipleLeaderboardsController
);

export default router;
