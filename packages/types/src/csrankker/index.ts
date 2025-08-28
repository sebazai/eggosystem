/**
 * Interface for CSRankker API response
 */
export interface CSRankkerResponse {
  status: string;
  result: {
    steamId: string;
    seasonId: number;
    originalKanaelo: number;
    stabilizedKanaelo: number;
    stabilizationInfo: {
      confidence: number;
      adjustmentFactor: number;
      method: string;
    };
    components: {
      trueLevel: number;
      mm: number;
      hour: number;
      kana: number;
    };
    calculus: string;
    timestamp: string;
  };
}
