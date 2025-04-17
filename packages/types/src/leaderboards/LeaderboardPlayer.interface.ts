export type LeaderboardPlayer = {
  steam_id?: string;
  nickname: string;
  team_name: string;
  team_logo?: string;
  value: number;
  matches_played: number;
  rank: number;
};
