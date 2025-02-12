export interface Match {
  id: number;
  league_id: number;
  season_id: number;
  stage: number; // TINYINT UNSIGNED, stored as number
  match_date: string; // DATE, represented as string (ISO format)
}
