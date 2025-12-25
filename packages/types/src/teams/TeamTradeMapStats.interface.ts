import { type Map } from "../db";

export interface TeamTradeMapStats {
  map_id: Map["id"];
  map_name: Map["name"];
  // Trade statistics (aggregated from PlayerStats for team)
  trades: number; // Successful trades
  trade_attempts: number; // Tried to trade
  trade_opportunities: number; // Had opportunity to trade
}
