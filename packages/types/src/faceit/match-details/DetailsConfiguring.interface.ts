import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitMapVoting,
  FaceitLocationVoting
} from "./Details.interface";

// Voting system for configuring matches
export interface FaceitConfiguringVoting {
  map: FaceitMapVoting;
  voted_entity_types: string[];
  location: FaceitLocationVoting;
}

// Main interface for FACEIT match details when status is CONFIGURING
export interface DetailsConfiguring {
  match_id: string;
  version: number;
  game: FaceitGame;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitConfiguringVoting;
  calculate_elo: boolean;
  scheduled_at?: number; // Unix timestamp
  configured_at: number; // Unix timestamp
  chat_room_id: string;
  best_of: number;
  status: "CONFIGURING";
  round: number;
  group: number;
  faceit_url: string;
}
