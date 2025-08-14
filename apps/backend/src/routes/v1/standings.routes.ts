import { Router } from "express";
import {
  getFaceitLeaguesController,
  getStandingsController
} from "../../controllers/standings.controllers";

const router = Router();

router.get("/leagues", getFaceitLeaguesController);
router.get("/:faceit_league_id", getStandingsController);

export default router;
