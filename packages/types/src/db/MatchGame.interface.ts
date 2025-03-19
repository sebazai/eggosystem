export interface MatchGame {
  id: number;
  match_id: number;
  map_id: number; // TINYINT UNSIGNED stored as number
  demofile: string; // demo file
  map_order?: number | null; // TINYINT UNSIGNED, optional
}
