// Interface for match data with stream URLs

export interface MatchWithStreamUrls {
  match_id: string;
  title: string;
  match_start: string;
  match_end: string;
  league_name: string;
  league_tier: number;
  streamUrl: string[];
  match_team1: string;
  match_team2: string;
  external_match_room_id: string | null;
  season_platform: string;
}
