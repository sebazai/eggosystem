/** Trade outcome for the opening duel of a round */
export type OpeningDuelTradeStatus =
  /** Victim died with no kill-back within ~5s — no support / bad position */
  | "isolated"
  /** A teammate attempted to trade but the killer survived */
  | "attempted"
  /** Killer was eliminated within ~5s — 1-for-1 exchange */
  | "converted";

export interface MatchGameOpeningDuel {
  round_number: number;
  /** Steam ID of the player who got the first kill */
  killer_steam_id: string;
  killer_team: "CT" | "T";
  /** Steam ID of the player who died first */
  victim_steam_id: string;
  victim_team: "CT" | "T";
  weapon: string;
  /** Seconds from round start when the kill occurred */
  time_in_round: number;
  is_headshot: boolean;
  /** Which side won the round */
  round_won_by: "CT" | "T";
  trade: OpeningDuelTradeStatus;
}
