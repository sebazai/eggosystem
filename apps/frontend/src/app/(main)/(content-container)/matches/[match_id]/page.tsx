import type { MatchInfo } from "@eggosystem/types";
import { getMatchInfo } from "./utils";
import { MatchStats } from "@/components/matches/match/match-stats";
import { GameStats } from "@/components/matches/match/game/game-stats";

interface PageProps {
  params: Promise<{ match_id: string }>;
}

export default async function MatchPage({ params }: PageProps) {
  const { match_id } = await params;
  // Convert match_id to a number
  const matchId = parseInt(match_id, 10);
  // Check if match_id is a valid number
  if (isNaN(matchId)) {
    throw new Error("Invalid match_id");
  }
  const result = await getMatchInfo<MatchInfo>(matchId);
  if (result.game_id) {
    return (
      <GameStats matchId={matchId} gameId={result.game_id} matchInfo={result} />
    );
  }
  return <MatchStats matchId={matchId} matchInfo={result} />;
}
