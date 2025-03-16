import { Router } from "express";
import passport from "passport";
import steam from "passport-steam";

import {
  login,
  logout,
  refreshToken
} from "../../controllers/auth.controllers";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

passport.use(
  new steam.Strategy(
    {
      returnURL: `${process.env.BACKEND_URL}/api/v1/auth/steam/return`,
      realm: `${process.env.BACKEND_URL}/`,
      apiKey: process.env.STEAM_API_KEY || ""
    },
    (identifier, profile, done) => {
      const user = {
        steamId: profile.id,
        displayName: profile.displayName
      };
      return done(null, user);
    }
  )
);
router.use(passport.initialize());

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

router.get("/steam", (req, res, next) => {
  const { returnUrl } = req.query;
  const returnUrlString = decodeURIComponent(returnUrl as string);

  if (returnUrlString && isValidReturnUrl(returnUrlString)) {
    res.cookie("steam_returnUrl", returnUrlString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60 * 1000 // 5 minutes
    });
  }

  passport.authenticate("steam", { session: false })(req, res, next);
});

router.get(
  "/steam/return",
  passport.authenticate("steam", { session: false, failureRedirect: "/" }),
  async (req, res) => {
    const returnUrl = req.cookies.steam_returnUrl;
    res.clearCookie("steam_returnUrl");

    const withFrontendUrl = returnUrl.startsWith("/")
      ? process.env.FRONTEND_URL + returnUrl
      : returnUrl;

    try {
      await login(req, res);
      if (!isValidReturnUrl(returnUrl)) {
        res.redirect(`${process.env.FRONTEND_URL}/login-success`);
      }
      res.redirect(withFrontendUrl);
    } catch (error) {
      console.error("Login error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/login-failed`);
    }
  }
);

router.post("/refresh", refreshToken);
router.get("/logout", logout);

router.get("/me", authenticateJWT, (req, res) => {
  if (req.auth) {
    res.json({ user: req.auth });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

export default router;
