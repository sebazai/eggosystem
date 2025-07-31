import { type PlayerStats } from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { type DemoPlayer } from "../types/parse-queue.types";

const createDemoPlayerToPlayerStatQueryMapper = (
  gameId: number,
  playerStats: DemoPlayer
) => {
  return {
    steam_id: String(playerStats.SteamID),
    game_id: gameId,
    kills: playerStats.Kills,
    deaths: playerStats.Deaths,
    assists: playerStats.Assists,
    assists_ct: playerStats.Assists_CT,
    assists_t: playerStats.Assists_T,
    deaths_t: playerStats.Deaths_T,
    deaths_ct: playerStats.Deaths_CT,
    kills_t: playerStats.Kills_T,
    kills_ct: playerStats.Kills_CT,
    trades_t: playerStats.Trades_T,
    trades_ct: playerStats.Trades_CT,
    traded_t: playerStats.Traded_T,
    traded_ct: playerStats.Traded_CT,
    total_mf_duration_t: playerStats.TotalMFDuration_T
      ? Number(playerStats.TotalMFDuration_T)
      : null,
    total_mf_duration_ct: playerStats.TotalMFDuration_CT
      ? Number(playerStats.TotalMFDuration_CT)
      : null,
    total_ef_duration_t: playerStats.TotalEFDuration_T
      ? Number(playerStats.TotalEFDuration_T)
      : null,
    total_ef_duration_ct: playerStats.TotalEFDuration_CT
      ? Number(playerStats.TotalEFDuration_CT)
      : null,
    mvps: playerStats.MVPs,
    total_damage: playerStats.TotalDamage,
    total_damage_ct: playerStats.TotalDamage_CT,
    total_damage_t: playerStats.TotalDamage_T,
    headshots: playerStats.HeadShots,
    flash_assists: playerStats.FlashAssists,
    flash_assists_ct: playerStats.FlashAssists_CT,
    flash_assists_t: playerStats.FlashAssists_T,
    adr: Number(playerStats.ADR),
    adr_t: Number(playerStats.ADR_T),
    adr_ct: Number(playerStats.ADR_CT),
    hs_percent: playerStats.HsPercent,
    plants: playerStats.Plants,
    explodes: playerStats.Explodes,
    defuses: playerStats.Defuses,
    first_kills: playerStats.FirstKills,
    kills_1: playerStats.Kills1,
    kills_2: playerStats.Kills2,
    kills_3: playerStats.Kills3,
    kills_4: playerStats.Kills4,
    kills_5: playerStats.Kills5,
    trades: playerStats.Trades,
    traded: playerStats.Traded,
    clutches_won: playerStats.ClutchesWon,
    clutches: playerStats.Clutches,
    awp_kills: playerStats.AWPKills,
    utility_damage: playerStats.UtilityDamage,
    utility_damage_ct: playerStats.UtilityDamage_CT,
    utility_damage_t: playerStats.UtilityDamage_T,
    molotov_damage: playerStats.MolotovDamage,
    molotov_damage_ct: playerStats.MolotovDamage_CT,
    molotov_damage_t: playerStats.MolotovDamage_T,
    he_damage: playerStats.HEDamage,
    he_damage_ct: playerStats.HEDamage_CT,
    he_damage_t: playerStats.HEDamage_T,
    trade_attempts: playerStats.TradeAttempts,
    trade_attempts_ct: playerStats.TradeAttempts_CT,
    trade_attempts_t: playerStats.TradeAttempts_T,
    kills_through_walls: playerStats.KillsThroughWalls,
    first_death_trade_attempts: playerStats.FirstDeathTradeAttempts,
    first_death_trade_attempts_ct: playerStats.FirstDeathTradeAttempts_CT,
    first_death_trade_attempts_t: playerStats.FirstDeathTradeAttempts_T,
    first_death_trade_opportunities: playerStats.FirstDeathTradeOppoturnities,
    first_death_trade_opportunities_ct:
      playerStats.FirstDeathTradeOppoturnities_CT,
    first_death_trade_opportunities_t:
      playerStats.FirstDeathTradeOppoturnities_T,
    trade_opportunities: playerStats.TradeOppoturnities,
    trade_opportunities_t: playerStats.TradeOppoturnities_T,
    trade_opportunities_ct: playerStats.TradeOppoturnities_CT,
    flashes_thrown: playerStats.FlashesThrown,
    flashes_thrown_t: playerStats.FlashesThrown_T,
    flashes_thrown_ct: playerStats.FlashesThrown_CT,
    enemies_flashed: playerStats.EnemiesFlashed,
    enemies_flashed_t: playerStats.EnemiesFlashed_T,
    enemies_flashed_ct: playerStats.EnemiesFlashed_CT,
    mates_flashed_t: playerStats.MatesFlashed_T,
    mates_flashed_ct: playerStats.MatesFlashed_CT,
    mates_flashed: playerStats.MatesFlashed,
    self_flashes: playerStats.SelfFlashes,
    first_deaths: playerStats.FirstDeaths,
    total_mf_duration: Number(playerStats.TotalMFDuration),
    total_ef_duration: Number(playerStats.TotalEFDuration),
    one_v_one_won: playerStats.OneVOneWon,
    one_v_one_lost: playerStats.OneVOneLost,
    one_v_one_won_ct: playerStats.OneVOneWon_CT,
    one_v_one_lost_ct: playerStats.OneVOneLost_CT,
    one_v_one_won_t: playerStats.OneVOneWon_T,
    one_v_one_lost_t: playerStats.OneVOneLost_T,
    kast: playerStats.KAST,
    kana_rating: Number(playerStats.KanaRating),
    first_kills_t: playerStats.FirstKills_T,
    first_kills_ct: playerStats.FirstKills_CT,
    first_deaths_t: playerStats.FirstDeaths_T,
    first_deaths_ct: playerStats.FirstDeaths_CT,
    first_death_trades: playerStats.FirstDeath_Trades,
    first_death_traded: playerStats.FirstDeath_Traded,
    first_death_trades_ct: playerStats.FirstDeath_Trades_CT,
    first_death_traded_ct: playerStats.FirstDeath_Traded_CT,
    first_death_trades_t: playerStats.FirstDeath_Trades_T,
    first_death_traded_t: playerStats.FirstDeath_Traded_T,
    ttd: playerStats.TTD,
    crosshair_placement: playerStats.CrosshairPlacement,
    ttf: playerStats.TTF,
    rws: playerStats.RWS,
    shots: playerStats.Shots,
    shots_hit: playerStats.ShotsHit,
    total_strafing_shots: playerStats.TotalStrafingShots,
    good_strafing_shots: playerStats.GoodStrafingShots
  } satisfies Omit<PlayerStats, "id">;
};

export const insertPlayerStatsForGame = async ({
  gameId,
  playerStats,
  connection
}: {
  gameId: number;
  playerStats: DemoPlayer;
  connection?: PoolConnection;
}) => {
  const playerStat = createDemoPlayerToPlayerStatQueryMapper(
    gameId,
    playerStats
  );
  // Build the keys and values strings properly
  const keys = Object.keys(playerStat);
  const insertIntoKeysString = keys.map((key) => `${key}`).join(", ");

  const insertIntoValuesQuestionMarks = keys.map(() => "?").join(", ");

  const query = `INSERT INTO PlayerStats (${insertIntoKeysString}) VALUES (${insertIntoValuesQuestionMarks})`;
  return runQuery(query, Object.values(playerStat), connection);
};
