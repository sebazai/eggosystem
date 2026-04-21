/** Per-player trade statistics for a single game, sourced from PlayerStats */
export interface PlayerTradeStats {
  steam_id: string;
  nickname: string;
  team_id: number;
  /** Total opportunities to trade a fallen teammate */
  trade_opportunities: number;
  /** Times the player actually attempted a trade */
  trade_attempts: number;
  /** Successful trades (teammate kill avenged within window) */
  trades: number;
  /** Times this player's death was traded by a teammate */
  traded: number;
  /** Total deaths this game */
  deaths: number;
  /** Times this player's first-kill-death was traded */
  first_death_traded: number;
  /** Times this player's first-kill-death was in a tradeable position */
  first_death_trade_opportunities: number;
  /** Total first-kill deaths this game */
  first_deaths: number;
}

/** A single trade event: trader avenged victim by killing their killer */
export interface TradeMatrixEntry {
  /** Steam ID of the player who made the trade */
  trader_steam_id: string;
  /** Steam ID of the enemy who originally made the kill (the one traded out) */
  killer_steam_id: string;
  /** Number of times this pair occurred */
  count: number;
}

export interface MatchGameTradeStats {
  players: PlayerTradeStats[];
  matrix: TradeMatrixEntry[];
}
