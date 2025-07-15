import {
  FaceitGame,
  FaceitMatchTeams,
  FaceitMapVoting,
  FaceitMatchResultsFinished,
  FaceitDetailedResultsFinished
} from "./Details.interface";

export interface DetailsDemoReady {
  match_id: string;
  version: number;
  game: FaceitGame.CS2;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  voting: Voting;
  calculate_elo: boolean;
  scheduled_at?: number;
  configured_at: number;
  started_at: number;
  finished_at: number;
  demo_url: string[];
  chat_room_id: string;
  best_of: number;
  results: FaceitMatchResultsFinished;
  detailed_results: FaceitDetailedResultsFinished[];
  status: string;
  round: number;
  group: number;
  faceit_url: string;
}

export interface Voting {
  voted_entity_types: string[];
  map: FaceitMapVoting;
}
