import passport from "passport";
import steam from "passport-steam";

import { getAuthUserBySteamId, createSteamPlayer } from "../models/auth.models";
import { clearPossibleRedisCacheForNewUser } from "../services/redis.services";
import type { UserPayload } from "@eggosystem/types";

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
          await createSteamPlayer({
            steamId: profile.id,
            steamDisplayName: profile.displayName,
            steamRealname: profile._json.realname
          });
          await clearPossibleRedisCacheForNewUser(profile.id);
          return done(null, {
            steamId: profile.id,
            displayName: profile.displayName
          } satisfies UserPayload);
        } catch (error) {
          return done(error);
        }
      }

      const user = {
        steamId: userInDb.steam_id,
        displayName: userInDb.name
      } satisfies UserPayload;

      return done(null, user);
    }
  )
);

export default passport;
