import {
  FaceitGame,
  FaceitMatchStatus,
  FaceitMatchTeams
} from "./Details.interface";

export interface DetailsObjectCreated {
  match_id: string;
  version: number;
  game: FaceitGame;
  region: string;
  competition_id: string;
  competition_type: string;
  competition_name: string;
  organizer_id: string;
  teams: FaceitMatchTeams;
  calculate_elo: boolean;
  chat_room_id: string;
  best_of: number;
  status: FaceitMatchStatus.VOTING | FaceitMatchStatus.CREATED; // Could be something else as well
  round: number;
  group: number;
  faceit_url: string;
}
