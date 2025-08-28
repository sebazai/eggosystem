export interface TeamEligibilityResult {
  selectedTeam: {
    team_id: number;
    team_name: string;
    current_top3_avg: number;
    current_top4_avg: number; // Added top 4 average
    new_avg_with_player: number;
    new_player_kana_elo: number;
    csrankker_components?: {
      trueLevel: number;
      mm: number;
      hour: number;
      kana: number;
    };
  };
  topTeamsInLeague: Array<{
    team_id: number;
    team_name: string;
    avg4: number;
    rank: number;
  }>;
  canAddPlayer: boolean;
  league_name: string;
}
