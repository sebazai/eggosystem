import { Router } from "express";
import {
  getMatchesBySeasonAndLeagueController,
  getMatchesByOrganizerAndAppController
} from "../../controllers/calendar.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

// Get calendar matches by season and league
router.get(
  "/seasons/:season_id/leagues/:league_id/matches",
  validateNumericParams(["season_id"]),
  getMatchesBySeasonAndLeagueController
);

/**
 * Get calendar matches by organizer_id and app_id
 * This is used for embeddable calendars that don't know the season_id
 *
 * Query parameters:
 * - league_id: Optional. Filter by specific league ID
 *
 * Example: /api/v1/calendar/organizers/1/apps/730/matches
 */
router.get(
  "/organizers/:organizer_id/apps/:app_id/matches",
  validateNumericParams(["organizer_id", "app_id"]),
  getMatchesByOrganizerAndAppController
);

export default router;
