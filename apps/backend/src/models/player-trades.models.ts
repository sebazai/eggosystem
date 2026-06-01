import { type PoolConnection } from "mysql2/promise";
import { type DemoTrades } from "../types/parse-queue.types";
import { runQuery } from "../db/mysqlRunQuery";
import { replaceMatchGameRows } from "../db/replaceMatchGameRows";

export const savePlayerTradesForGame = async ({
  matchGameId,
  playerTrades,
  connection
}: {
  matchGameId: number;
  playerTrades: DemoTrades;
  connection: PoolConnection;
}) => {
  await replaceMatchGameRows(
    connection,
    matchGameId,
    "PlayerTrades",
    async () => {
      const tradesToBeAdded = Object.values(playerTrades).flatMap((trades) =>
        Object.values(trades).flatMap((trade) => trade)
      );

      if (tradesToBeAdded.length === 0) return;

      const values = tradesToBeAdded.map((trade) => [
        matchGameId,
        trade.Trader,
        trade.Killer,
        trade.Victim,
        trade.RoundNumber,
        trade.FirstDeath,
        trade.Traded,
        trade.Attempted,
        trade.Time,
        trade.TradeTime,
        trade.DeathTime,
        trade.TradeDenied === true ? 1 : 0,
        trade.TradeTimeout === true ? 1 : 0,
        trade.DenialTime ?? null,
        trade.TradeWindow ?? null
      ]);

      const placeholders = values
        .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .join(", ");

      await runQuery(
        `INSERT INTO PlayerTrades (
        match_game_id,
        trader_steam_id,
        killer_steam_id,
        victim_steam_id,
        round_number,
        first_death,
        traded,
        attempted,
        time,
        trade_time,
        death_time,
        trade_denied,
        trade_timeout,
        denial_time,
        trade_window
      ) VALUES ${placeholders}`,
        values.flat(),
        connection
      );
    }
  );
};
