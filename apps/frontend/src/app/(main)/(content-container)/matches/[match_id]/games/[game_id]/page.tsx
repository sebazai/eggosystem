import type { MatchInfo } from "@eggosystem/types";
import { getMatchInfo } from "../../utils";
import { GameStats } from "@/components/matches/match/game/game-stats";

interface PageProps {
  params: Promise<{ match_id: string; game_id: string }>;
}

export default async function MatchGamePage({ params }: PageProps) {
  const { match_id, game_id } = await params;
  const matchId = parseInt(match_id, 10);
  const gameId = parseInt(game_id, 10);
  if (isNaN(matchId) || isNaN(gameId)) {
    throw new Error("Invalid match_id or game_id");
  }
  const matchInfo = await getMatchInfo<MatchInfo>(matchId);
  return (
    <GameStats matchId={matchId} gameId={gameId} teams={matchInfo.teams} />
  );
}
