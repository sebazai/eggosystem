import { type Nullable } from "@eggosystem/types";
import { convertCSGORankToCS2 } from "../utils/ranks";

const isMatchmakingRank = (game: GameRanks): game is MatchmakingRankType =>
  game.dataSource === "matchmaking";

// Ranktypes
// 11 = premier
// 12 = map based comp

interface MatchmakingRankType {
  dataSource: "matchmaking";
  rankType: Nullable<number>;
  skillLevel: number;
  isCs2: boolean;
}

interface FaceITRankType {
  dataSource: "faceit";
  rankType: null;
  skillLevel: null;
  elo: number;
  isCs2: boolean;
}

type GameRanks = MatchmakingRankType | FaceITRankType;

export interface LeetifyResponse {
  games: Array<GameRanks>;
}

export const getCS2RankFromLeetify = async (steam_id: string) => {
  const webURL = "https://api.cs-prod.leetify.com/api/profile/id/" + steam_id;

  const result = await fetch(webURL);
  if (!result.ok) {
    return undefined;
  }
  const data: LeetifyResponse = await result.json();

  const firstMatchmakingGame = data.games.find(
    (g): g is MatchmakingRankType =>
      isMatchmakingRank(g) && g.rankType === 11 && g.isCs2 && g.skillLevel > 0
  );
  if (firstMatchmakingGame) {
    return { rank: firstMatchmakingGame.skillLevel };
  }

  const firstCSGOGame = data.games.find(
    (g): g is MatchmakingRankType =>
      isMatchmakingRank(g) && !g.isCs2 && g.skillLevel > 0
  );
  if (firstCSGOGame) {
    return convertCSGORankToCS2(firstCSGOGame.skillLevel);
  }

  return undefined;
};
