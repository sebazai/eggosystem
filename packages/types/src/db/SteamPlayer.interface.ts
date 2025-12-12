export interface SteamPlayer {
  steam_id: string;
  nickname: string;
  account_id: number;
  faceit_id: string | null;
  faceit_nickname: string | null;
  avatar: string | null;
}
