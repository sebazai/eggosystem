export interface Player {
  steam_id: string; // Typically represented as a string in TypeScript due to size
  name: string;
  email?: string | null;
  player_name?: string | null;
  work_email?: string | null;
  discord?: string | null;
}
