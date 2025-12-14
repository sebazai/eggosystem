import { Router } from "express";
import { getHallOfFameController } from "../../controllers/hall-of-fame.controllers";

const router = Router();

/**
 * GET /api/v1/hall-of-fame
 * Query params:
 *   - category: "organizations" | "teams" | "players" (default: "players")
 *   - limit: number (default: 50, max: 100)
 */
router.get("/", getHallOfFameController);

export default router;
