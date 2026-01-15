export interface TeamEligibilityResult {
  selectedTeam: {
    team_id: number;
    team_name: string;
    current_top4_avg: number; // Now top 4 based on TOP_N_FOR_CURRENT_AVG=4
    current_top5_avg: number; // Now top 5 based on TOP_N_FOR_COMPARISON=5
    new_avg_with_player: number;
    new_player_kana_elo: number;
    csrankker_components?: {
      trueLevel: number;
      mm: number;
      hour: number;
      kana: number;
    };
    csrankker_calculus?: string;
    csrankker_original_kanaelo?: number; // Original/offered ELO before stabilization
  };
  topTeamsInLeague: Array<{
    team_id: number;
    team_name: string;
    avg5: number; // Now avg5 based on TOP_N_FOR_COMPARISON=5
    rank: number;
  }>;
  canAddPlayer: boolean;
  league_name: string;
}
