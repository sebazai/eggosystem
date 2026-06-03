/** A single cross-team kill pairing with total kill count for the game */
export interface KillMatrixEntry {
  killer_steam_id: string;
  victim_steam_id: string;
  count: number;
}

/** A single flash-assist pairing — flasher's flash led to victim being killed */
export interface FlashMatrixEntry {
  assister_steam_id: string;
  victim_steam_id: string;
  count: number;
}

export interface MatchGameKillMatrix {
  kills: KillMatrixEntry[];
  flash_assists: FlashMatrixEntry[];
}

/** Optional filters applied when computing a game's kill matrix */
export interface KillMatrixFilters {
  excludeExitKills?: boolean;
  postPlantOnly?: boolean;
  excludeEcoKills?: boolean;
}
