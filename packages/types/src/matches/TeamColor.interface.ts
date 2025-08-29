import { Team, Organizations } from "../db";

// Team color variants for consistent theming
export type TeamColor = "orange" | "blue";

// Base team info interface
export interface TeamInfo {
  id?: Team["id"];
  name?: Team["name"];
  logo?: Team["team_logo"];
  rank?: number | null;
  organization_name?: Organizations["name"];
  score?: number; // Score doesn't have a direct database mapping
}

// Teams record type
export type TeamsRecord = Record<string, TeamInfo>;
