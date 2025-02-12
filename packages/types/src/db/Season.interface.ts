export interface Season {
  id: number;
  game_id: number;
  name: string;
  full_name: string;
  start_date?: string | null; // DATE stored as string (ISO format)
  end_date?: string | null;
}
