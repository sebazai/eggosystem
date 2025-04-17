import { SteamPlayer, Team, Nullable } from "@eggosystem/types";

export interface MatchTopPlayerAwardsValue {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  value: Nullable<number>;
  team_id: Team["id"];
}

export interface MatchTopPlayerAwards {
  most_kills: Nullable<MatchTopPlayerAwardsValue>;
  most_adr: Nullable<MatchTopPlayerAwardsValue>;
  most_assists: Nullable<MatchTopPlayerAwardsValue>;
  most_awp_kills: Nullable<MatchTopPlayerAwardsValue>;
  most_utility_damage: Nullable<MatchTopPlayerAwardsValue>;
  most_first_kills: Nullable<MatchTopPlayerAwardsValue>;
  most_flash_assists: Nullable<MatchTopPlayerAwardsValue>;
  most_mates_flashed: Nullable<MatchTopPlayerAwardsValue>;
}
