import type {
  Nullable,
  Organizations,
  Team,
  SteamPlayer
} from "@eggosystem/types";

/**
 * Hall of Fame entry types for organizations, teams, and players
 * Trophy points: Gold (1st place) = 3 points, Silver (2nd) = 2 points, Bronze (3rd) = 1 point
 */

/**
 * Trophy group - count of trophies grouped by image_phash
 */
export interface TrophyGroup {
  image_phash: string;
  trophy_name: string;
  placement: number;
  count: number;
}

export interface TrophyCounts {
  gold: number;
  silver: number;
  bronze: number;
  total_points: number;
}

export interface HallOfFameOrganization extends TrophyCounts {
  organization_id: Organizations["id"];
  organization_name: Organizations["name"];
  organization_logo: Nullable<Organizations["logo"]>;
  trophies: TrophyGroup[];
}

export interface HallOfFameTeam extends TrophyCounts {
  team_id: Team["id"];
  team_name: Team["name"];
  team_logo: Nullable<Team["team_logo"]>;
  organization_id: Nullable<Organizations["id"]>;
  organization_name: Nullable<Organizations["name"]>;
  trophies: TrophyGroup[];
}

export interface HallOfFamePlayer extends TrophyCounts {
  steam_id: SteamPlayer["steam_id"];
  player_name: SteamPlayer["nickname"];
  avatar: Nullable<SteamPlayer["avatar"]>;
  trophies: TrophyGroup[];
}

export type HallOfFameCategory = "organizations" | "teams" | "players";

export interface HallOfFameResponse {
  category: HallOfFameCategory;
  data: HallOfFameOrganization[] | HallOfFameTeam[] | HallOfFamePlayer[];
}
