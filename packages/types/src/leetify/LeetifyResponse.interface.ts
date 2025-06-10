// Ranktypes
// 11 = premier
// 12 = map based comp

import { Nullable } from "../utils";

export interface MatchmakingRankType {
  dataSource: "matchmaking";
  rankType: Nullable<number>;
  skillLevel: number;
  isCs2: boolean;
  gameFinishedAt: string;
}

export interface FaceITRankType {
  dataSource: "faceit";
  rankType: null;
  skillLevel: null;
  elo: number;
  isCs2: boolean;
  gameFinishedAt: string;
}

export type GameRanks = MatchmakingRankType | FaceITRankType;

export interface LeetifyResponse {
  games: Array<GameRanks>;
}
