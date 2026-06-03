export interface PlayerActiveSeason {
  season_id: number;
  full_name: string;
  start_date: string;
  end_date: string | null;
}

export interface PlayerActiveSeasons {
  current_season: PlayerActiveSeason | null;
  last_season: PlayerActiveSeason | null;
}

/** Scope for resolving a player's current/last played seasons (historical UI). */
export interface PlayerSeasonContextQuery {
  organizer_id: number;
  app_id: number;
  gametype: string;
}
