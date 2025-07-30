import { Router } from "express";
import { getStandingsController } from "../../controllers/standings.controllers";

const router = Router();

// GET /api/v1/standings/:league_id
router.get("/:league_id", getStandingsController);

export default router;
