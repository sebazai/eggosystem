import _ from "lodash";

interface IPlayerServiceResponse {
  response: {
    games: {
      appid: number;
      playtime_forever: number;
    }[];
  };
}

export const getSteamHoursForAppId = async (
  steam_id: string,
  app_id: string
) => {
  const webURL = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steam_id}&appids_filter=${app_id}`;
  const fromSteam = await fetch(webURL);
  if (!fromSteam.ok) {
    return null;
  }
  const data: IPlayerServiceResponse = await fromSteam.json();
  const games = data.response.games;
  const requestedAppId = games.find((game) => String(game.appid) === "730");

  if (!requestedAppId) {
    return null;
  }
  return requestedAppId;
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
