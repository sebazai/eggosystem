import type { MatchInfo } from "@eggosystem/types";
import { getMatchInfo } from "../../utils";
import { GameStats } from "@/components/match/games/game-stats";

interface PageProps {
  params: Promise<{ match_id: string; game_id: string }>;
}

export default async function MatchGamePage({ params }: PageProps) {
  const { match_id, game_id } = await params;
  const matchInfo = await getMatchInfo<MatchInfo>(match_id);
  return (
    <GameStats matchId={match_id} gameId={game_id} teams={matchInfo.teams} />
  );
}
