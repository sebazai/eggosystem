export interface FaceitMatch {
  match_id: string;
  scheduled_at: number;
  started_at?: number;
  status: string;
  best_of: number;
  teams: {
    [key: string]: {
      name: string;
    };
  };
}

export interface FaceitMatchesResponse {
  items: FaceitMatch[];
  start: number;
  end: number;
}
