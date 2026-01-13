import { Router } from "express";
import {
  emailsVerifiedController,
  getAccountMatchReservationsController,
  sendVerificationEmails,
  updateAccountProfileController
} from "../../controllers/account.controllers";
import {
  getCasterDefaultUrlController,
  updateCasterDefaultUrlController,
  deleteCasterDefaultUrlController
} from "../../controllers/caster-urls.controllers";
import {
  getMyTeamsController,
  getMyTeamsUpcomingMatchesController,
  getMyTeamChampionshipsController
} from "../../controllers/my-team.controllers";
import { uploadTeamLogoController } from "../../controllers/team-logo.controllers";
import { uploadPlayerAvatarController } from "../../controllers/player-avatar.controllers";
import { validateNumericParams } from "../../middlewares/validate-numeric-params";
import { getAuthUserBySteamId } from "../../models/auth.models";
import { type UserProfilePayload } from "@eggosystem/types";
import {
  getUserProfileAcceptanceForVersion,
  getLatestUserProfileNewsletterConsent
} from "../../models/user-policy-acceptance.models";
import {
  auditReadEntity,
  auditUpdateEntity
} from "../../middlewares/audit-log.middleware";
import {
  authenticateJWT,
  checkJWTPermissions
} from "../../middlewares/auth.middleware";
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

    const userPolicy = await getUserProfileAcceptanceForVersion(
      req.auth.account_id,
      process.env.PRIVACY_POLICY_VERSION
    );

    const hasNewsletterConsent = userPolicy
      ? userPolicy.accepted_tournament_newsletter
      : // Default to true (opt-out) if privacy_policy version changes
        await getLatestUserProfileNewsletterConsent(req.auth.account_id);

    const userPayload = {
      fullName: userInDb.full_name,
      workEmail: userInDb.work_email,
      acceptedNewsletter: hasNewsletterConsent
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

// Caster default URL routes (require caster role)
router.get(
  "/caster/default-url",
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["caster"] }),
  getCasterDefaultUrlController
);
router.post(
  "/caster/default-url",
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["caster"] }),
  updateCasterDefaultUrlController
);
router.delete(
  "/caster/default-url",
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["caster"] }),
  deleteCasterDefaultUrlController
);

router.get(
  "/reservations/match/:match_id",
  validateNumericParams(),
  authenticateJWT,
  checkJWTPermissions({ fallbackRoles: ["caster"] }),
  getAccountMatchReservationsController
);

// My Team routes
router.get("/my-teams", authenticateJWT, getMyTeamsController);
router.get(
  "/my-teams/upcoming-matches",
  authenticateJWT,
  getMyTeamsUpcomingMatchesController
);
router.get(
  "/my-teams/championships/:season_id/:league_id",
  validateNumericParams(["season_id", "league_id"]),
  authenticateJWT,
  getMyTeamChampionshipsController
);
router.post("/my-teams/upload-logo", authenticateJWT, uploadTeamLogoController);

// Avatar upload route
router.post("/upload-avatar", authenticateJWT, uploadPlayerAvatarController);

export default router;
