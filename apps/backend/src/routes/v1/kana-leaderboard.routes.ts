import { Router } from "express";
import { getKanaLeaderboardController } from "../../controllers/kana-leaderboard.controllers";

const router = Router();

// Public leaderboard of the top-50 players by live kana elo.
router.get("/", getKanaLeaderboardController);

export default router;
