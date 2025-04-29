import { Router } from "express";
import {
  emailsVerifiedController,
  sendVerificationEmails,
  updateAccountProfileController
} from "../../controllers/account.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";

const router = Router();

router.post("/update", updateAccountProfileController);
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
