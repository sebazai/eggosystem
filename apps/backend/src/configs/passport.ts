import passport from "passport";
import steam from "passport-steam";

import {
  getAuthUserBySteamId,
  createAccountForSteam
} from "../models/auth.models";
import { clearPossibleRedisCacheForNewUser } from "../services/redis.services";
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
          await clearPossibleRedisCacheForNewUser(profile.id);
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

      const user = {
        account_id: userInDb.account_id,
        provider_id: profile.id,
        nickname: userInDb.nickname,
        provider: "steam"
      } satisfies SteamUserPayload;

      return done(null, user);
    }
  )
);

export default passport;
