import { Router } from "express";
import {
  getPlayoffSeedLeaguesController,
  getPlayoffSeedsController,
  putPlayoffSeedsController
} from "../../../controllers/dashboard/playoff-seeds.controllers";

const router = Router();

router.get("/season/:season_id/leagues", getPlayoffSeedLeaguesController);
router.get("/season/:season_id/league/:league_id", getPlayoffSeedsController);
router.put("/season/:season_id/league/:league_id", putPlayoffSeedsController);

export default router;
