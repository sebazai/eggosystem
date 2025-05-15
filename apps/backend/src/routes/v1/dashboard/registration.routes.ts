import { Router } from "express";
import { addManuallyApprovedPlayersController } from "../../../controllers/dashboard/registration.controllers";
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

export default router;
