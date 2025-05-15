import { Router } from "express";
import { addManuallyApprovedPlayers } from "../../../controllers/dashboard/registration.controllers";
import { checkPermissions } from "../../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/approved",
  checkPermissions({
    staticPermissions: ["write:registration"],
    fallbackRoles: ["admin", "helpdesk"]
  }),
  addManuallyApprovedPlayers
);

export default router;
