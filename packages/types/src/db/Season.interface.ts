import {
  Nullable,
  type Game,
  type SeasonPlatform,
  GameType,
  Organizer
} from "@eggosystem/types";

export interface Season {
  id: number;
  game_id: Game["id"];
  game_type_id: GameType["id"];
  organizer_id: Organizer["id"];
  name: string;
  full_name: string;
  signup_start_date: string | null;
  signup_end_date: string | null;
  platform: SeasonPlatform;
  start_date: string; // DATE stored as string (ISO format)
  end_date: string | null;
  is_round_robin_bo2_as_2xbo1: boolean;
  grand_final_round_one_only: boolean;
}

export interface InsertSeason {
  id: number;
  game_id: Game["id"];
  game_type_id: GameType["id"];
  organizer_id: Organizer["id"];
  name: string;
  full_name: string;
  signup_start_date: Nullable<Date>;
  signup_end_date: Nullable<Date>;
  platform: SeasonPlatform;
  start_date: Date; // DATE stored as string (ISO format)
  end_date: Nullable<Date>;
  is_round_robin_bo2_as_2xbo1?: boolean;
}
