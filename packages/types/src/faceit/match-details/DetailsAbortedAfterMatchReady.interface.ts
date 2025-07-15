import {
  FaceitGame,
  FaceitMapVoting,
  FaceitMatchResultsAbortedAndCancelled,
  FaceitDetailedResultsAbortedAndCancelled,
  FaceitMatchTeams
} from "./Details.interface";

// Voting interface
interface FaceitMatchVotingAborted {
  map: FaceitMapVoting;
  voted_entity_types: string[];
}
// Main match details interface for aborted matches
export interface FaceitMatchDetailsAborted {
  match_id: string;
  version: number;
  game: FaceitGame.CS2;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitMatchVotingAborted;
  calculate_elo: boolean;
  configured_at: number;
  chat_room_id: string;
  best_of: number;
  results: FaceitMatchResultsAbortedAndCancelled;
  detailed_results: FaceitDetailedResultsAbortedAndCancelled[];
  status: "ABORTED";
  round: number;
  group: number;
  faceit_url: string;
}
