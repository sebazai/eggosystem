import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitMapVoting,
  FaceitMatchResultsAbortedAndCancelled,
  FaceitDetailedResultsAbortedAndCancelled,
  FaceitLocationVoting
} from "./Details.interface";

export interface FaceitDetailsCancelled {
  match_id: string;
  version: number;
  game: FaceitGame.CS2;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitCancelledVoting;
  calculate_elo: boolean;
  configured_at: number;
  finished_at: number;
  chat_room_id: string;
  best_of: number;
  results: FaceitMatchResultsAbortedAndCancelled;
  detailed_results: FaceitDetailedResultsAbortedAndCancelled[];
  status: "CANCELLED";
  faceit_url: string;
}

// Extended voting interface that includes location voting (not in Details.interface.ts)
interface FaceitCancelledVoting {
  map: FaceitMapVoting;
  voted_entity_types: string[];
  location: FaceitLocationVoting;
}
