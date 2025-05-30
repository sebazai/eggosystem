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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFaceITCSRank(obj: any): obj is FaceITCSRank {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.faceit_level === "number" &&
    obj.faceit_level >= 0 &&
    typeof obj.faceit_elo === "number" &&
    obj.faceit_elo >= 0 &&
    typeof obj.faceit_kd === "number" &&
    obj.faceit_kd >= 0 &&
    typeof obj.faceit_date === "number" &&
    obj.faceit_date >= 0 &&
    typeof obj.metadata === "object" &&
    obj.metadata !== null &&
    (typeof obj.metadata.faceit_matches_played === "undefined" ||
      typeof obj.metadata.faceit_matches_played === "number") &&
    (typeof obj.metadata.faceit_last_match === "undefined" ||
      typeof obj.metadata.faceit_last_match === "number") &&
    typeof obj.metadata.faceit_decay === "boolean"
  );
}
