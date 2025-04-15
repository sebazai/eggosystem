import { Router } from "express";
import passport from "passport";

import {
  login,
  logout,
  refreshToken
} from "../../controllers/auth.controllers";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { getAuthUserBySteamId } from "../../models/auth.models";
import type { UserFullPayload } from "@eggosystem/types";
import {
  getLatestUserProfileMarketingConsent,
  getUserProfileAcceptanceForVersion
} from "../../models/account.models";

const router = Router();

const isValidReturnUrl = (returnUrl: string) => {
  try {
    // If it's a relative path (e.g., "/dashboard"), allow it
    if (returnUrl.startsWith("/")) return true;

    // Otherwise, parse it as a full URL
    const parsedUrl = new URL(returnUrl);
    const allowedDomain = new URL(process.env.FRONTEND_URL ?? "").origin;

    return parsedUrl.origin === allowedDomain;
  } catch (_error) {
    return false;
  }
};

const getValidReturnUrl = (returnUrl?: string) => {
  if (!returnUrl) {
    return process.env.FRONTEND_URL + "/login-success";
  }
  if (isValidReturnUrl(returnUrl)) {
    if (returnUrl.startsWith("/")) {
      return process.env.FRONTEND_URL + returnUrl;
    }
    return returnUrl;
  }
  return process.env.FRONTEND_URL + "/login-success";
};

router.get("/steam", (req, res, next) => {
  const { returnUrl } = req.query;

  if (returnUrl) {
    const returnUrlString = decodeURIComponent(String(returnUrl));
    if (isValidReturnUrl(returnUrlString)) {
      res.cookie("steam_returnUrl", returnUrlString, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 5 * 60 * 1000 // 5 minutes
      });
    }
  }

  passport.authenticate("steam", { session: false })(req, res, next);
});

router.get(
  "/steam/return",
  passport.authenticate("steam", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login-failed`
  }),
  async (req, res) => {
    const returnUrl: string | undefined = req.cookies.steam_returnUrl;
    res.clearCookie("steam_returnUrl");

    const redirectTo = getValidReturnUrl(returnUrl);

    try {
      await login(req, res);
      res.redirect(redirectTo);
    } catch (_error) {
      res.redirect(`${process.env.FRONTEND_URL}/login-failed`);
    }
  }
);

router.post("/refresh", refreshToken);
router.get("/logout", logout);

router.get("/me", authenticateJWT, async (req, res) => {
  if (req.auth && req.auth.provider === "steam") {
    const userInDb = await getAuthUserBySteamId(req.auth.provider_id);
    if (!userInDb) {
      res.status(403).json({ message: "Bad request" });
      return;
    }

    const result = await getUserProfileAcceptanceForVersion(
      req.auth.account_id,
      process.env.PRIVACY_POLICY_VERSION
    );

    const hasMarketingConsent = result
      ? result.accepted_marketing
      : // Tick the marketing box if privacy_policy version changes and user had it ticked.
        await getLatestUserProfileMarketingConsent(req.auth.account_id);

    const userPayload = {
      account_id: userInDb.account_id,
      provider_id: userInDb.steam_id,
      provider: "steam",
      nickname: userInDb.nickname,
      fullName: userInDb.full_name,
      workEmail: userInDb.work_email,
      email: userInDb.email,
      discord: userInDb.discord,
      acceptedPrivacyPolicy: result ? result.accepted_privacy_policy : false,
      acceptedMarketing: hasMarketingConsent
    } satisfies UserFullPayload;
    res.json({ user: userPayload });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

export default router;
