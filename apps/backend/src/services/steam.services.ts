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
