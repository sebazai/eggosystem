import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { type DemoRoundImpact } from "../types/parse-queue.types";

function toNumber(v: string | number): number {
  return typeof v === "string" ? parseFloat(v) : v;
}

export const upsertPlayerRoundImpactsForGame = async ({
  matchGameId,
  roundImpacts,
  connection
}: {
  matchGameId: number;
  roundImpacts: DemoRoundImpact[];
  connection?: PoolConnection;
}) => {
  if (!roundImpacts?.length) {
    return;
  }

  const query = `INSERT INTO PlayerRoundImpacts (
    match_game_id,
    round_number,
    player_steam_id,
    kills,
    assists,
    first_kill,
    trades,
    damage_dealt,
    flash_assists,
    first_kill_flash_assists,
    impact_score,
    entry_kill,
    exit_kill,
    bomb_planted,
    bomb_defused,
    bomb_exploded,
    kill_opponent_value,
    win_prob_impact,
    trade_denials,
    failed_trades,
    trade_efficiency
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    kills = VALUES(kills),
    assists = VALUES(assists),
    first_kill = VALUES(first_kill),
    trades = VALUES(trades),
    damage_dealt = VALUES(damage_dealt),
    flash_assists = VALUES(flash_assists),
    first_kill_flash_assists = VALUES(first_kill_flash_assists),
    impact_score = VALUES(impact_score),
    entry_kill = VALUES(entry_kill),
    exit_kill = VALUES(exit_kill),
    bomb_planted = VALUES(bomb_planted),
    bomb_defused = VALUES(bomb_defused),
    bomb_exploded = VALUES(bomb_exploded),
    kill_opponent_value = VALUES(kill_opponent_value),
    win_prob_impact = VALUES(win_prob_impact),
    trade_denials = VALUES(trade_denials),
    failed_trades = VALUES(failed_trades),
    trade_efficiency = VALUES(trade_efficiency)`;

  await Promise.all(
    roundImpacts.map((impact) =>
      runQuery(
        query,
        [
          matchGameId,
          impact.RoundNumber,
          String(impact.SteamID),
          impact.Kills,
          impact.Assists,
          impact.FirstKill ? 1 : 0,
          impact.Trades,
          impact.ADR, // Parser calls it ADR but it's damage dealt this round
          impact.FlashAssists,
          impact.FirstKillFlashAssists,
          toNumber(impact.ImpactScore),
          impact.EntryKill ? 1 : 0,
          impact.ExitKill ? 1 : 0,
          impact.BombPlanted ? 1 : 0,
          impact.BombDefused ? 1 : 0,
          impact.BombExploded ? 1 : 0,
          toNumber(impact.KillOpponentValue),
          toNumber(impact.WinProbImpact),
          impact.TradeDenials ?? 0,
          impact.FailedTrades ?? 0,
          impact.TradeEfficiency ?? 0
        ],
        connection
      )
    )
  );
};
