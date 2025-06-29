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
import { getRolesForAccountId } from "../../services/auth.services";
import { logger } from "../../utils/app-logger";
import {
  updateUserDiscordId,
  getDiscordIdByAccountId
} from "../../models/discord.models";

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

router.get(
  "/steam",
  // Set returnUrl cookie if it's valid
  (req, res, next) => {
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
    next();
  },
  passport.authenticate("steam", { session: false })
);

router.get(
  "/steam/return",
  passport.authenticate("steam", {
    session: false
  }),
  async (req, res) => {
    const returnUrl: string | undefined = req.cookies.steam_returnUrl;
    res.clearCookie("steam_returnUrl");

    const redirectTo = getValidReturnUrl(returnUrl);

    try {
      await login(req, res);
      res.redirect(redirectTo);
    } catch (error) {
      logger.error("Steam login error", error);
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

    const userPolicy = await getUserProfileAcceptanceForVersion(
      req.auth.account_id,
      process.env.PRIVACY_POLICY_VERSION
    );

    // Used as frontend "validation"
    const roles = await getRolesForAccountId(userInDb.account_id);

    const hasMarketingConsent = userPolicy
      ? userPolicy.accepted_marketing
      : // Tick the marketing box if privacy_policy version changes and user had it ticked.
        await getLatestUserProfileMarketingConsent(req.auth.account_id);

    // Check if user has Discord linked
    const discordId = await getDiscordIdByAccountId(userInDb.account_id);
    const discordLinked = !!discordId;

    const userPayload = {
      account_id: userInDb.account_id,
      provider_id: userInDb.steam_id,
      provider: "steam",
      nickname: userInDb.nickname,
      acceptedPrivacyPolicy: userPolicy
        ? userPolicy.accepted_privacy_policy
        : false,
      acceptedMarketing: hasMarketingConsent,
      isPersonalEmail: userInDb.is_work_email_personal_email,
      discordLinked,
      roles
    } satisfies UserFullPayload;
    res.json({ user: userPayload });
    return;
  }
  res.status(401).json({ message: "Unauthorized" });
});

// Discord OAuth endpoints
router.get("/discord/login", authenticateJWT, (req, res) => {
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  logger.info(
    `Setting Discord link cookie for account_id: ${req.auth.account_id}`
  );

  // Store the user's account_id in a cookie for the callback
  res.cookie("discord_link_account_id", req.auth.account_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 5 * 60 * 1000 // 5 minutes
  });

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${process.env.BACKEND_URL}/api/v1/auth/discord/callback`,
    response_type: "code",
    scope: "identify"
  });

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  logger.info(`Redirecting to Discord OAuth: ${discordAuthUrl}`);
  res.redirect(discordAuthUrl);
});

router.get("/discord/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    const accountId = req.cookies.discord_link_account_id;

    logger.info(
      `Discord callback received. Code: ${code ? "present" : "missing"}, Account ID: ${accountId || "missing"}}`
    );

    if (!code) {
      logger.error("No code provided in Discord callback");
      res.redirect(
        `${process.env.FRONTEND_URL}/kanahautomo?discordError=no_code`
      );
      return;
    }

    if (!accountId) {
      logger.error("No account_id found in any cookies for Discord callback");
      res.redirect(
        `${process.env.FRONTEND_URL}/kanahautomo?discordError=no_account`
      );
      return;
    }

    // Clear the cookie
    res.clearCookie("discord_link_account_id");

    // Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.BACKEND_URL}/api/v1/auth/discord/callback`
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Fetch user info from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    if (!userResponse.ok) {
      throw new Error(`User info fetch failed: ${userResponse.statusText}`);
    }

    const discordUser = await userResponse.json();
    const discordUserId = discordUser.id;

    // Store Discord user ID in database
    await updateUserDiscordId(Number(accountId), discordUserId);

    logger.info(
      `Discord account linked for user ${accountId}: ${discordUserId}`
    );

    // Redirect back to frontend with success
    res.redirect(
      `${process.env.FRONTEND_URL}/kanahautomo?discordLinked=1&discordUserId=${discordUserId}`
    );
  } catch (error) {
    logger.error("Discord OAuth callback error:", error);
    res.redirect(
      `${process.env.FRONTEND_URL}/kanahautomo?discordError=callback_failed`
    );
  }
});

export default router;
