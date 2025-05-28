import type { MatchGame, MatchInfo } from "@eggosystem/types";
import { getMatchGame, getMatchInfo } from "../../utils";
import { GameStats } from "@/components/matches/match/game/game-stats";
import { ContentContainer } from "@/components/layout/content-container";
import { createExternalMatchRoomUrl } from "@/components/matches/match/utils";

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

  try {
    await getMatchGame<MatchGame | { error: string }>(matchId, gameId);
  } catch (_error) {
    return (
      <ContentContainer>{`Could not fetch game ${gameId} for match ${matchId}.`}</ContentContainer>
    );
  }

  const matchInfo = await getMatchInfo<MatchInfo>(matchId);
  return (
    <GameStats
      matchId={matchId}
      gameId={gameId}
      matchInfo={matchInfo}
      platform={matchInfo.season_platform}
      externalMatchRoomUrl={createExternalMatchRoomUrl(
        matchInfo.external_match_room_id,
        matchInfo.season_platform
      )}
    />
  );
}
