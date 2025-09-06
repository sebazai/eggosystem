export interface FaceitMatchStatsResponse {
  rounds: Array<{
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
