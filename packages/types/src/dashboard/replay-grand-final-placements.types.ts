export interface ReplayGrandFinalPlacementsRequest {
  match_id?: number;
  external_match_room_id?: string;
  season_id?: number;
  league_id?: number;
}

export interface ReplayGrandFinalPlacementsResponse {
  applied: boolean;
  season_id: number | null;
  league_id: number | null;
  stage_id: number | null;
  external_match_room_id: string | null;
  placements: Array<{ team_id: number; placement: number }>;
  skipped_reason: string | null;
}
