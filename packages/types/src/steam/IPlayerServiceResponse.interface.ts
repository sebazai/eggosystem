export interface IPlayerServiceResponse {
  response: {
    games?: {
      appid: number;
      playtime_forever: number;
    }[];
  };
}
