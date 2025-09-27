import { type PoolConnection } from "mysql2/promise";
import { type DemoTrades } from "../types/parse-queue.types";
import { runQuery } from "../db/mysqlRunQuery";

export const upsertPlayerTradesForGame = async ({
  matchGameId,
  playerTrades,
  connection
}: {
  matchGameId: number;
  playerTrades: DemoTrades;
  connection?: PoolConnection;
}) => {
  const tradesToBeAdded = Object.values(playerTrades).flatMap((trades) =>
    Object.values(trades).flatMap((trade) => trade)
  );

  const query = `INSERT INTO PlayerTrades 
    (match_game_id,
    trader_steam_id, 
    killer_steam_id, 
    victim_steam_id, 
    round_number, 
    first_death, 
    traded, 
    attempted, 
    time, 
    trade_time, 
    death_time) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      trader_steam_id = VALUES(trader_steam_id),
      killer_steam_id = VALUES(killer_steam_id),
      victim_steam_id = VALUES(victim_steam_id),
      first_death = VALUES(first_death),
      traded = VALUES(traded),
      attempted = VALUES(attempted),
      time = VALUES(time),
      trade_time = VALUES(trade_time),
      death_time = VALUES(death_time)`;

  await Promise.all(
    tradesToBeAdded.map((trade) => {
      return runQuery(
        query,
        [
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
          trade.DeathTime
        ],
        connection
      );
    })
  );
};
