import { SteamPlayer, Team, Nullable } from "@eggosystem/types";

export interface TopPlayerAwardsValue {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  value: Nullable<number>;
  team_id: Team["id"];
}

export interface MatchOrGameTopPlayerAwards {
  most_kills: Nullable<TopPlayerAwardsValue>;
  most_adr: Nullable<TopPlayerAwardsValue>;
  most_assists: Nullable<TopPlayerAwardsValue>;
  most_awp_kills: Nullable<TopPlayerAwardsValue>;
  most_utility_damage: Nullable<TopPlayerAwardsValue>;
  most_first_kills: Nullable<TopPlayerAwardsValue>;
  most_flash_assists: Nullable<TopPlayerAwardsValue>;
  most_mates_flashed: Nullable<TopPlayerAwardsValue>;
}
