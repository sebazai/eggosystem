import passport from "passport";
import { SteamOpenIdStrategy } from "passport-steam-openid";

import {
  getAuthUserBySteamId,
  createAccountForSteam
} from "../models/auth.models";
import { clearPossibleRedisCacheForNewUser } from "../services/redis.services";
import type { SteamUserPayload } from "@eggosystem/types";
import { logger } from "../utils/app-logger";

passport.use(
  new SteamOpenIdStrategy(
    {
      returnURL: `${process.env.BACKEND_URL}/api/v1/auth/steam/return`,
      profile: true,
      apiKey: process.env.STEAM_API_KEY || "",
      maxNonceTimeDelay: 600
    },
    async (req, identifier, profile, done) => {
      const userInDb = await getAuthUserBySteamId(profile.steamid);

      if (!userInDb) {
        try {
          const insert = await createAccountForSteam({
            steamId: profile.steamid,
            steamDisplayName: profile.personaname,
            steamRealname: profile.realname
          });
          await clearPossibleRedisCacheForNewUser(profile.steamid);
          return done(null, {
            account_id: insert.account_id,
            provider_id: profile.steamid,
            nickname: profile.personaname,
            provider: "steam"
          } satisfies SteamUserPayload);
        } catch (error) {
          logger.error("Passport config", error);
          return done(error);
        }
      }

      const user = {
        account_id: userInDb.account_id,
        provider_id: profile.steamid,
        nickname: userInDb.nickname,
        provider: "steam"
      } satisfies SteamUserPayload;

      return done(null, user);
    }
  )
);

export default passport;
