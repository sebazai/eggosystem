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
