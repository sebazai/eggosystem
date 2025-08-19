import { Router } from "express";
import {
  addManuallyApprovedPlayersController,
  addManualRankForPlayerController,
  getRegisteredTeamsController,
  getPlayerFullNameController,
  getAllRegistrationDraftsController,
  bulkApproveTeamRegistrationsController,
  manualValidityCheckController
} from "../../../controllers/dashboard/registration.controllers";
import { auditReadEntity } from "../../../middlewares/audit-log.middleware";

const router = Router();

router.post("/approved", addManuallyApprovedPlayersController);
router.get(
  "/players/:steamId/full-name",
  auditReadEntity("Accounts through SteamPlayer", "steamId"),
  getPlayerFullNameController
);
router.post("/rank", addManualRankForPlayerController);
router.get("/registered", getRegisteredTeamsController);
router.get("/drafts", getAllRegistrationDraftsController);
router.post("/bulk-approve", bulkApproveTeamRegistrationsController);
router.post("/manual-validity-check", manualValidityCheckController);

export default router;
