import {
  FaceitDetailedResultsFinished,
  FaceitGame,
  FaceitMapVoting,
  FaceitMatchResultsFinished,
  FaceitMatchTeams
} from "./Details.interface";

// Voting interface
interface FaceitMatchVotingFinished {
  map: FaceitMapVoting;
  voted_entity_types: string[];
}

// Main match details interface for finished matches (after aborted)
export interface FaceitMatchDetailsFinishedAfterAborted {
  match_id: string;
  version: number;
  game: FaceitGame.CS2;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: FaceitMatchVotingFinished;
  scheduled_at?: number;
  calculate_elo: boolean;
  configured_at: number;
  finished_at: number;
  chat_room_id: string;
  best_of: number;
  results: FaceitMatchResultsFinished;
  detailed_results: FaceitDetailedResultsFinished[];
  status: "FINISHED";
  round: number;
  group: number;
  faceit_url: string;
}
