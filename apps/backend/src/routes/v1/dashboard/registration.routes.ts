import { Router } from "express";
import {
  addManuallyApprovedPlayersController,
  addManualRankForPlayerController,
  getRegisteredTeamsController,
  getPlayerFullNameController
} from "../../../controllers/dashboard/registration.controllers";
import { checkPermissions } from "../../../middlewares/auth.middleware";
import { auditReadEntity } from "../../../middlewares/audit-log.middleware";

const router = Router();

router.post(
  "/approved",
  checkPermissions({
    staticPermissions: ["write:registration"],
    fallbackRoles: ["admin", "helpdesk"]
  }),
  addManuallyApprovedPlayersController
);
router.get(
  "/players/:steamId/full-name",
  checkPermissions({
    staticPermissions: ["read:registration"],
    fallbackRoles: ["admin", "helpdesk"]
  }),
  auditReadEntity("Accounts through SteamPlayer", "steamId"),
  getPlayerFullNameController
);
router.post(
  "/rank",
  checkPermissions({
    staticPermissions: ["write:rank"],
    fallbackRoles: ["admin", "helpdesk"]
  }),
  addManualRankForPlayerController
);
router.get(
  "/registered",
  checkPermissions({
    staticPermissions: ["read:registration"],
    fallbackRoles: ["admin", "helpdesk"]
  }),
  getRegisteredTeamsController
);

export default router;
