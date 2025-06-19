interface BaseResponse {
  steam_id: string;
  nickname: string;
  team_name: string;
  team_logo: string;
  matches_played: number;
}

export type LeaderboardResponse = {
  // AVG stats
  kana_rating: Array<BaseResponse & { kana_rating: number }>;
  kast: Array<BaseResponse & { kast: number }>;
  hs_percent: Array<BaseResponse & { hs_percent: number }>;
  adr: Array<BaseResponse & { adr: number }>;

  // SUM stats
  kills: Array<BaseResponse & { kills: number }>;
  assists: Array<BaseResponse & { assists: number }>;
  deaths: Array<BaseResponse & { deaths: number }>;
  flash_assists: Array<BaseResponse & { flash_assists: number }>;
  utility_damage: Array<BaseResponse & { utility_damage: number }>;
  total_damage: Array<BaseResponse & { total_damage: number }>;
  awp_kills: Array<BaseResponse & { awp_kills: number }>;
  headshots: Array<BaseResponse & { headshots: number }>;
  enemies_flashed: Array<BaseResponse & { enemies_flashed: number }>;
  mates_flashed: Array<BaseResponse & { mates_flashed: number }>;
  self_flashes: Array<BaseResponse & { self_flashes: number }>;
  clutches_won: Array<BaseResponse & { clutches_won: number }>;
  one_v_one_won: Array<BaseResponse & { one_v_one_won: number }>;
  first_deaths: Array<BaseResponse & { first_deaths: number }>;
  first_kills: Array<BaseResponse & { first_kills: number }>;
  flashes_thrown: Array<BaseResponse & { flashes_thrown: number }>;
  total_ef_duration: Array<BaseResponse & { total_ef_duration: number }>;

  // Derived stats
  kd: Array<BaseResponse & { kd: number }>;

  // New derived stats
  first_kills_deaths_ratio: Array<
    BaseResponse & { first_kills_deaths_ratio: number }
  >;
  kills_per_round: Array<BaseResponse & { kills_per_round: number }>;
  utility_damage_per_round: Array<
    BaseResponse & { utility_damage_per_round: number }
  >;
  awp_kills_per_round: Array<BaseResponse & { awp_kills_per_round: number }>;
  assists_per_round: Array<BaseResponse & { assists_per_round: number }>;
  enemies_flashed_per_flash: Array<
    BaseResponse & { enemies_flashed_per_flash: number }
  >;
  avg_enemy_flash_time: Array<BaseResponse & { avg_enemy_flash_time: number }>;
  avg_teammate_flash_time: Array<
    BaseResponse & { avg_teammate_flash_time: number }
  >;
};
