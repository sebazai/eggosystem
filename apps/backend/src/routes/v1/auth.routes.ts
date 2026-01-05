import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../../utils/errors";

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
  getLatestUserProfileNewsletterConsent,
  getUserProfileAcceptanceForVersion,
  hasAcceptedAnyPrivacyPolicy
} from "../../models/user-policy-acceptance.models";
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

router.get("/me", authenticateJWT, async (req, res, next) => {
  if (req.auth && req.auth.provider === "steam") {
    const userInDb = await getAuthUserBySteamId(req.auth.provider_id);
    if (!userInDb) {
      return next(new ForbiddenError("Bad request"));
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

    const hasNewsletterConsent = userPolicy
      ? userPolicy.accepted_tournament_newsletter
      : // Default to true (opt-out) if privacy_policy version changes
        await getLatestUserProfileNewsletterConsent(req.auth.account_id);

    // Check if user has accepted any previous privacy policy version
    const hasAcceptedPreviousPolicy = await hasAcceptedAnyPrivacyPolicy(
      req.auth.account_id
    );

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
      acceptedNewsletter: hasNewsletterConsent,
      hasAcceptedPreviousPolicy,
      isPersonalEmail: userInDb.is_work_email_personal_email,
      discordLinked,
      roles
    } satisfies UserFullPayload;
    res.json({ user: userPayload });
    return;
  }
  return next(new UnauthorizedError("Unauthorized"));
});

// Discord OAuth endpoints
router.get("/discord/login", authenticateJWT, (req, res, next) => {
  if (!req.auth) {
    return next(new UnauthorizedError("Unauthorized"));
  }

  const returnTo = (req.query.returnTo as string) || "kanahautomo";
  const validReturnTo = ["kanahautomo", "profile"].includes(returnTo)
    ? returnTo
    : "kanahautomo";

  logger.info(
    `Initiating Discord OAuth for account_id: ${req.auth.account_id}, returnTo: ${validReturnTo}`
  );

  const stateToken = jwt.sign(
    { account_id: req.auth.account_id, returnTo: validReturnTo },
    process.env.JWT_SECRET!,
    { expiresIn: "5m" }
  );

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${process.env.BACKEND_URL}/api/v1/auth/discord/callback`,
    response_type: "code",
    scope: "identify",
    state: stateToken
  });

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  logger.info(
    `Redirecting to Discord OAuth for account_id: ${req.auth.account_id}`
  );
  res.redirect(discordAuthUrl);
});

router.get("/discord/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    logger.info(
      `Discord callback received. Code: ${code ? "present" : "missing"}, State: ${state ? "present" : "missing"}`
    );

    // Default returnTo for error cases - will be overridden if state is valid
    let errorReturnTo = "profile";

    if (!code) {
      logger.error("No code provided in Discord callback");
      // Try to extract returnTo from state if available
      if (state) {
        try {
          const decoded = jwt.decode(state) as { returnTo?: string } | null;
          if (decoded?.returnTo) {
            errorReturnTo = decoded.returnTo;
          }
        } catch {
          // Ignore decode errors, use default
        }
      }
      res.redirect(
        `${process.env.FRONTEND_URL}/${errorReturnTo}?discordError=no_code`
      );
      return;
    }

    if (!state) {
      logger.error("No state parameter provided in Discord callback");
      res.redirect(
        `${process.env.FRONTEND_URL}/${errorReturnTo}?discordError=no_state`
      );
      return;
    }

    let accountId: number;
    let returnTo = "kanahautomo";
    try {
      const decoded = jwt.verify(state, process.env.JWT_SECRET!) as {
        account_id: number;
        returnTo?: string;
      };
      accountId = decoded.account_id;
      returnTo = decoded.returnTo || "kanahautomo";
    } catch (jwtError) {
      logger.error(
        "Invalid or expired state token in Discord callback:",
        jwtError
      );
      res.redirect(
        `${process.env.FRONTEND_URL}/kanahautomo?discordError=invalid_state`
      );
      return;
    }

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
      const errorText = await tokenResponse.text();
      logger.error(
        `Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`,
        {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText
        }
      );
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    if (!access_token) {
      throw new Error("No access token received from Discord");
    }

    // Fetch user info from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      logger.error(
        `User info fetch failed: ${userResponse.status} ${userResponse.statusText}`,
        {
          status: userResponse.status,
          statusText: userResponse.statusText,
          error: errorText
        }
      );
      throw new Error(`User info fetch failed: ${userResponse.statusText}`);
    }

    const discordUser = await userResponse.json();
    const discordUserId = discordUser.id;
    const discordUsername = discordUser.username; // Discord username (e.g., "username" without discriminator)

    if (!discordUserId) {
      throw new Error("No Discord user ID received");
    }

    // Store Discord user ID and username in database
    await updateUserDiscordId(accountId, discordUserId, discordUsername);

    logger.info(
      `Discord account linked for user ${accountId}: ${discordUserId}${discordUsername ? ` (${discordUsername})` : ""}, redirecting to: ${returnTo}`
    );

    // Redirect back to frontend with success
    res.redirect(
      `${process.env.FRONTEND_URL}/${returnTo}?discordLinked=1&discordUserId=${discordUserId}`
    );
  } catch (error) {
    logger.error("Discord OAuth callback error:", error);
    // Try to extract returnTo from state for error case
    let errorReturnTo = "kanahautomo";
    try {
      const state = req.query.state as string;
      if (state) {
        const decoded = jwt.decode(state) as { returnTo?: string } | null;
        if (decoded?.returnTo) {
          errorReturnTo = decoded.returnTo;
        }
      }
    } catch {
      // Ignore decode errors, use default
    }
    res.redirect(
      `${process.env.FRONTEND_URL}/${errorReturnTo}?discordError=callback_failed`
    );
  }
});

export default router;
