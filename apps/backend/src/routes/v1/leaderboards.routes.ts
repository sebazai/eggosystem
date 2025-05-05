import { Router } from "express";
import {
  getMultipleLeaderboardsController,
  getLeaderboardTypesController
} from "../../controllers/leaderboards.controllers";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";

const router = Router();

router.get(
  "/multiple",
  parseQueryFilterParams,
  getMultipleLeaderboardsController
);

router.get("/types", getLeaderboardTypesController);

export default router;
