import type { Player } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import _ from "lodash";

/**
 * Should never be used for frontend.
 * @param steam_id
 * @returns Player
 */
export const getFullPlayerDetails = async (steam_id: string) => {
  const results = await runQuery<Player[]>(
    `SELECT * FROM Players WHERE steam_id = ?`,
    [steam_id]
  );
  return results.length > 0 ? results[0] : undefined;
};

interface ISteamUserResponse {
  response: {
    players: { steamid: string; communityvisibilitystate: number }[];
  };
}
export const isSteamProfilePublic = async (steam_id: string) => {
  const steamUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steam_id}`;
  const result = await fetch(steamUrl);
  const data: ISteamUserResponse = await result.json();
  if (data.response.players.length === 0) {
    throw new Error("Invalid steam id or profile not found");
  }
  return data.response.players[0].communityvisibilitystate === 3;
};

export const areSteamProfilesPublic = async (steam_ids: string[]) => {
  const ids = steam_ids.join(",");
  const steamUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${ids}`;
  const result = await fetch(steamUrl);
  const data: ISteamUserResponse = await result.json();

  const fetchedSteamIds = data.response.players.map((p) => p.steamid);
  const diff = _.xor(steam_ids, fetchedSteamIds);
  if (diff.length > 0) {
    throw new Error(`Failed to fetch steam ids ${diff.join(",")}`);
  }
  const isPublic: Record<string, boolean> = Object.fromEntries(
    data.response.players.map((p) => [
      p.steamid,
      p.communityvisibilitystate === 3
    ])
  );

  const allPublic = Object.values(isPublic).every((v) => v === true);
  if (allPublic) {
    return { is_all_public: allPublic };
  }

  const hiddenProfiles = Object.keys(isPublic).filter((key) => !isPublic[key]);

  return { is_all_public: allPublic, not_public: hiddenProfiles };
};
