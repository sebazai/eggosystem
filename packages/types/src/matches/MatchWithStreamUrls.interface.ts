// Interface for match data with stream URLs

import { League, Match, Season, SeasonLeague } from "../db";

export interface MatchWithStreamUrls {
  match_id: string;
  title: string;
  match_start: string; // ISO 8601 timestamp string (UTC)
  match_end: string; // ISO 8601 timestamp string (UTC)
  match_status: Match["status"];
  league_name: League["name"];
  league_tier: SeasonLeague["tier"];
  stream_urls: string[];
  match_team1: string;
  match_team2: string;
  external_match_room_id: Match["external_match_room_id"];
  season_platform: Season["platform"];
}
