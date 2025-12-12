import { Router } from "express";
import {
  getAllTeams,
  getTeamByIdController,
  getTeamsWithoutOrgController
} from "../../controllers/teams.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { getTeamRosterHistory } from "../../models/roster-history.models";
import type { RosterHistoryResponse } from "@eggosystem/types";

const router = Router();

// Regular team routes
router.get("/", getAllTeams);
router.get("/org-missing", getTeamsWithoutOrgController);

router.get(
  "/:team_id",
  validateNumericParams(["team_id"]),
  getTeamByIdController
);

// Roster history for importing previous rosters during signup
router.get(
  "/:team_id/roster-history",
  validateNumericParams(["team_id"]),
  authenticateJWT,
  async (req, res, next) => {
    try {
      const teamId = Number(req.params.team_id);
      const seasons = await getTeamRosterHistory(teamId);
      res.json({ seasons } satisfies RosterHistoryResponse);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
