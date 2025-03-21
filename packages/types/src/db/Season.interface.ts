import type { Game } from "@eggosystem/types";

export interface Season {
  id: number;
  game_id: Game["id"];
  name: string;
  full_name: string;
  signup_start_date: string | null;
  signup_end_date: string | null;
  platform: string;
  start_date: string; // DATE stored as string (ISO format)
  end_date: string | null;
}
