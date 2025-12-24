import passport from "passport";
import steam from "passport-steam";

import {
  getAuthUserBySteamId,
  createAccountForSteam,
  updateSteamLinkedAccountUsername
} from "../models/auth.models";
import type { SteamUserPayload } from "@eggosystem/types";
import { logger } from "../utils/app-logger";

passport.use(
  new steam.Strategy(
    {
      returnURL: `${process.env.BACKEND_URL}/api/v1/auth/steam/return`,
      realm: `${process.env.BACKEND_URL}/`,
      apiKey: process.env.STEAM_API_KEY || ""
    },
    async (identifier, profile, done) => {
      const userInDb = await getAuthUserBySteamId(profile.id);

      if (!userInDb) {
        try {
          const insert = await createAccountForSteam({
            steamId: profile.id,
            steamDisplayName: profile.displayName,
            steamRealname: profile._json.realname
          });
          return done(null, {
            account_id: insert.account_id,
            provider_id: profile.id,
            nickname: profile.displayName,
            provider: "steam"
          } satisfies SteamUserPayload);
        } catch (error) {
          logger.error("Passport config", error);
          return done(error);
        }
      }

      // Update username in LinkedAccounts if it has changed
      try {
        await updateSteamLinkedAccountUsername(profile.id, profile.displayName);
      } catch (error) {
        logger.error("Failed to update Steam username", error);
        // Continue with login even if update fails
      }

      const user = {
        account_id: userInDb.account_id,
        provider_id: profile.id,
        nickname: profile.displayName,
        provider: "steam"
      } satisfies SteamUserPayload;

      return done(null, user);
    }
  )
);

export default passport;
