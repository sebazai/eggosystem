export interface FaceITCSRank {
  faceit_level: number;
  faceit_elo: number;
  faceit_kd: number;
  faceit_date: number;
  metadata: {
    faceit_matches_played?: number;
    faceit_last_match?: number;
    faceit_decay: boolean;
  };
}
