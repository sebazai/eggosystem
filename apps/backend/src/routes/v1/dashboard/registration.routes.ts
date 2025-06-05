import { Router } from "express";
import {
  addManuallyApprovedPlayersController,
  addManualRankForPlayerController,
  getRegisteredTeamsController
} from "../../../controllers/dashboard/registration.controllers";
import { checkPermissions } from "../../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/approved",
  checkPermissions({
    staticPermissions: ["write:registration"],
    fallbackRoles: ["admin", "helpdesk"]
  }),
  addManuallyApprovedPlayersController
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
