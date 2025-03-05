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
      returnURL: `http://localhost:3001/api/v1/auth/steam/return`,
      realm: `http://localhost:3001/`,
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

router.get(
  "/steam",
  passport.authenticate("steam", { session: false, failureRedirect: "/" })
);

router.get(
  "/steam/return",
  passport.authenticate("steam", { session: false, failureRedirect: "/" }),
  login
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
