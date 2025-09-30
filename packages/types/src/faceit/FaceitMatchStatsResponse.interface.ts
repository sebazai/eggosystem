export interface FaceitMatchStatsResponse {
  rounds: Array<{
    best_of: string;
    played: string;
    round_stats: {
      Rounds: string;
    };
    teams: Array<{
      team_stats: {
        Team: string;
        "Final Score": string;
      };
    }>;
  }>;
}
