import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitMapVoting,
  FaceitLocationVoting
} from "./Details.interface";

// Voting system for ready matches (same structure as configuring)
export interface FaceitReadyVoting {
  map: FaceitMapVoting;
  voted_entity_types: string[];
  location: FaceitLocationVoting;
}

// Main interface for FACEIT match details when status is READY
export interface DetailsReady {
  match_id: string;
  version: number;
  game: FaceitGame.CS2;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitReadyVoting;
  calculate_elo: boolean;
  scheduled_at: number; // Unix timestamp
  configured_at: number; // Unix timestamp
  chat_room_id: string;
  best_of: number;
  status: "READY";
  round: number;
  group: number;
  faceit_url: string;
}
