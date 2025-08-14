import { Router } from "express";
import {
  getAllLeagues,
  getLeaguesBySeasonController
} from "../../controllers/leagues.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.get("/", getAllLeagues);
router.get(
  "/:season_id",
  validateNumericParams(["season_id"]),
  getLeaguesBySeasonController
);

export default router;
