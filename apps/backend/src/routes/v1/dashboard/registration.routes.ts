import { Router } from "express";
import {
  addManuallyApprovedPlayersController,
  addManualRankForPlayerController,
  getRegisteredTeamsController,
  getPlayerFullNameController,
  getAllRegistrationDraftsController,
  bulkApproveTeamRegistrationsController,
  manualValidityCheckController,
  addSignupForSeasonAdminController
} from "../../../controllers/dashboard/registration.controllers";
import { auditReadEntity } from "../../../middlewares/audit-log.middleware";
import { validateNumericParams } from "../../../middlewares/validate-numeric-params";

const router = Router();

router.post("/approved", addManuallyApprovedPlayersController);
router.get(
  "/players/:steamId/full-name",
  auditReadEntity("Accounts through SteamPlayer", "steamId"),
  getPlayerFullNameController
);
router.post("/rank", addManualRankForPlayerController);
router.get(
  "/season/:season_id/registered",
  validateNumericParams(["season_id"]),
  getRegisteredTeamsController
);
router.get(
  "/season/:season_id/drafts",
  validateNumericParams(["season_id"]),
  getAllRegistrationDraftsController
);
router.post(
  "/season/:season_id/bulk-approve",
  validateNumericParams(["season_id"]),
  bulkApproveTeamRegistrationsController
);
router.post(
  "/season/:season_id/manual-validity-check",
  validateNumericParams(["season_id"]),
  manualValidityCheckController
);
router.post(
  "/season/:season_id/signup",
  validateNumericParams(),
  addSignupForSeasonAdminController
);

export default router;
