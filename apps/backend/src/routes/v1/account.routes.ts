import { Router } from "express";
import {
  emailsVerifiedController,
  sendVerificationEmails,
  updateAccountProfileController
} from "../../controllers/account.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import { getAuthUserBySteamId } from "../../models/auth.models";
import { type UserProfilePayload } from "@eggosystem/types";

const router = Router();

router.post("/update", updateAccountProfileController);
router.get("/profile", async (req, res) => {
  if (req.auth && req.auth.provider === "steam") {
    const userInDb = await getAuthUserBySteamId(req.auth.provider_id);
    if (!userInDb) {
      res.status(403).json({ message: "Bad request" });
      return;
    }

    const userPayload = {
      fullName: userInDb.full_name,
      workEmail: userInDb.work_email,
      discord: userInDb.discord
    } satisfies UserProfilePayload;
    res.json({ details: userPayload });
    return;
  }
  res.status(401).json({ message: "Unauthorized" });
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
