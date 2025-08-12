import { Router } from "express";
import {
  emailsVerifiedController,
  sendVerificationEmails,
  updateAccountProfileController
} from "../../controllers/account.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import { getAuthUserBySteamId } from "../../models/auth.models";
import { type UserProfilePayload } from "@eggosystem/types";
import {
  auditReadEntity,
  auditUpdateEntity
} from "../../middlewares/audit-log.middleware";
import { ForbiddenError, UnauthorizedError } from "../../utils/errors";

const router = Router();

router.post(
  "/update",
  auditUpdateEntity("Accounts"),
  updateAccountProfileController
);
router.get("/profile", auditReadEntity("Accounts"), async (req, res, next) => {
  if (req.auth && req.auth.provider === "steam") {
    const userInDb = await getAuthUserBySteamId(req.auth.provider_id);
    if (!userInDb) {
      return next(new ForbiddenError("Bad request"));
    }

    const userPayload = {
      fullName: userInDb.full_name,
      workEmail: userInDb.work_email,
      discord: userInDb.discord
    } satisfies UserProfilePayload;
    res.json({ details: userPayload });
    return;
  }
  return next(new UnauthorizedError("Unauthorized"));
});

router.get(
  "/:id/emails-verified",
  validateNumericParams(),
  emailsVerifiedController
);
router.post(
  "/:id/emails/send-verifications",
  validateNumericParams(),
  sendVerificationEmails
);

export default router;
