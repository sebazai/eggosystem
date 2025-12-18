import { Router } from "express";
import {
  getSeasonResultsController,
  getSeasonsWithPlacementsController
} from "../../controllers/season-results.controllers";

const router = Router();

/**
 * GET /api/v1/season-results
 * Query params:
 *   - season_id: number (required) - Season to get results for
 * Returns top 3 teams per division for the specified season
 */
router.get("/", getSeasonResultsController);

/**
 * GET /api/v1/season-results/seasons
 * Returns list of seasons that have placements (for dropdown selector)
 */
router.get("/seasons", getSeasonsWithPlacementsController);

export default router;
