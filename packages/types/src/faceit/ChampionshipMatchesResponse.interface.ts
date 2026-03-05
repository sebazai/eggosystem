/**
 * Response shape for GET /data/v4/championships/{championship_id}/matches.
 * Items are in reverse chronological order (last game first); reverse for bracket tree order.
 */
export interface FaceitChampionshipMatchFaction {
  faction_id: string;
  name: string;
  avatar: string;
  leader?: string;
  roster?: unknown[];
  substituted?: boolean;
  type?: string;
}

export interface FaceitChampionshipMatchItem {
  match_id: string;
  round: number;
  group: number;
  status: string;
  best_of: number;
  scheduled_at: number;
  started_at?: number;
  finished_at?: number;
  teams: {
    faction1: FaceitChampionshipMatchFaction;
    faction2: FaceitChampionshipMatchFaction;
  };
  results?: {
    winner?: string;
    score?: {
      faction1?: number;
      faction2?: number;
    };
  };
}

export interface FaceitChampionshipMatchesResponse {
  items: FaceitChampionshipMatchItem[];
  start: number;
  end: number;
}
