import { type PoolConnection } from "mysql2/promise";
import { runQuery } from "../db/mysqlRunQuery";
import { replaceMatchGameRows } from "../db/replaceMatchGameRows";
import { type DemoRoundImpact } from "../types/parse-queue.types";
import { keepLastByKey } from "../utils/keep-last-by-key";

function toNumber(v: string | number): number {
  return typeof v === "string" ? parseFloat(v) : v;
}

export const savePlayerRoundImpactsForGame = async ({
  matchGameId,
  roundImpacts,
  connection
}: {
  matchGameId: number;
  roundImpacts: DemoRoundImpact[];
  connection: PoolConnection;
}) => {
  await replaceMatchGameRows(
    connection,
    matchGameId,
    "PlayerRoundImpacts",
    async () => {
      if (!roundImpacts?.length) return;

      const uniqueImpacts = keepLastByKey(
        roundImpacts,
        (impact) => `${impact.RoundNumber}:${impact.SteamID}`
      );

      const values = uniqueImpacts.map((impact) => [
        matchGameId,
        impact.RoundNumber,
        String(impact.SteamID),
        impact.Kills,
        impact.Assists,
        impact.FirstKill ? 1 : 0,
        impact.Trades,
        impact.ADR,
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
      ]);

      const placeholders = values
        .map(
          () =>
            "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .join(", ");

      await runQuery(
        `INSERT INTO PlayerRoundImpacts (
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
        ) VALUES ${placeholders}`,
        values.flat(),
        connection
      );
    }
  );
};
