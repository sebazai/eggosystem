import _ from "lodash";

// E2E Test mode mocking
const isE2EMode = process.env.NODE_ENV === 'e2e' || process.env.TEST_TYPE === 'e2e';

export interface IPlayerServiceResponse {
  response: {
    games?: {
      appid: number;
      playtime_forever: number;
    }[];
  };
}

export const getSteamHoursForAppId = async (
  steam_id: string,
  app_id: number
) => {
  // E2E Mock: Return mock hours data
  if (isE2EMode) {
   
    // Special case: Return null for hours detection failure (results in hours: -1)
    if (steam_id === "76561197960269868") {  // Real Steam ID for insufficient hours test
     
      return null; // This will result in hours: -1 in the frontend
    }
    
    // Default: Return sufficient hours for all other Steam IDs (including success tests)
   
    return {
      appid: app_id,
      playtime_forever: 90000 // 1500 hours in minutes
    };
  }

 
  const webURL = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steam_id}`;
  const fromSteam = await fetch(webURL);
  if (!fromSteam.ok) {
    return null;
  }
  const data: IPlayerServiceResponse = await fromSteam.json();
  const games = data.response?.games;
  const requestedAppId = games?.find((game) => game.appid === app_id);

  if (!requestedAppId) {
    return null;
  }
  return requestedAppId;
};

export interface ISteamUserResponse {
  response: {
    players: { steamid: string; communityvisibilitystate: number }[];
  };
}

export const isSteamProfilePublic = async (steam_id: string) => {
  // E2E Mock: Always return true (public profile)
  if (isE2EMode) {
    
    // Special case: Return private profile for REAL Steam ID from dev seed (account_id 1)
    if (steam_id === "76561197967885016") {  // Real Steam ID for private profile test
      
      return false;
    }
    
    // Default: Return public for all other Steam IDs (including success tests)
    return true;
  }

  const steamUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steam_id}`;
  const result = await fetch(steamUrl);
  if (!result.ok) {
    const text = await result.text();
    console.error("Failed to fetch steam profile", result.status, text);
    throw new Error("Failed to fetch steam profile public status");
  }
  const data: ISteamUserResponse = await result.json();
  if (data.response.players.length === 0) {
    throw new Error("Invalid steam id or profile not found");
  }
  return data.response.players[0].communityvisibilitystate === 3;
};

export const areSteamProfilesPublic = async (steam_ids: string[]) => {
  // E2E Mock: Always return all profiles as public
  if (isE2EMode) {
   
    
    // Special case: Check if any Steam ID should be private for testing
    const privateProfiles = steam_ids.filter(id => id === "76561197967885016"); // Real Steam ID for private profile test (account_id 1)
    
    if (privateProfiles.length > 0) {
     
      return { 
        is_all_public: false, 
        not_public: privateProfiles 
      };
    }
    
    // Default: All profiles are public
    return { is_all_public: true };
  }

  const ids = steam_ids.join(",");
  const steamUrl = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${ids}`;
  const result = await fetch(steamUrl);
  if (!result.ok) {
    const text = await result.text();
    console.error("Failed to fetch steam profiles", result.status, text);
    throw new Error("Failed to fetch steam profiles public status");
  }
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
