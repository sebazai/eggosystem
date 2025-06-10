export interface ISteamUserResponse {
  response: {
    players: { steamid: string; communityvisibilitystate: number }[];
  };
}
