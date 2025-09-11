/**
 * Minimal Faceit API response structure
 * Only includes the fields we actually use
 */
export interface FaceitPlayerDetails {
  player_id: string;
  games: {
    [key: string]: {
      skill_level: number;
      faceit_elo: number;
    };
  };
  faceit_url: string;
}

/**
 * Simplified player rank data returned by our API
 * Exactly matches the return structure of getFaceITGameRankWithUrl
 */
export interface FaceitPlayerRankWithUrl {
  elo: number;
  rank: number;
  player_id: string;
  faceit_url: string;
}
