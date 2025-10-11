import type { MatchGame, MatchInfo } from "@eggosystem/types";
import { getMatchGame, getMatchInfo } from "../../utils";
import { GameStats } from "@/components/matches/match/game/GameStats";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { createExternalMatchRoomUrl } from "@/components/matches/match/utils";

interface PageProps {
  params: Promise<{ match_id: string; match_game_id: string }>;
}

export default async function MatchGamePage({ params }: PageProps) {
  const { match_id, match_game_id } = await params;
  const matchId = parseInt(match_id, 10);
  const matchGameId = parseInt(match_game_id, 10);
  if (isNaN(matchId) || isNaN(matchGameId)) {
    throw new Error("Invalid match_id or match_game_id");
  }

  try {
    await getMatchGame<MatchGame | { error: string }>(matchId, matchGameId);
  } catch (_error) {
    return (
      <ContentContainer>{`Could not fetch game ${matchGameId} for match ${matchId}.`}</ContentContainer>
    );
  }

  const matchInfo = await getMatchInfo<MatchInfo>(matchId);
  return (
    <GameStats
      matchId={matchId}
      matchGameId={matchGameId}
      matchInfo={matchInfo}
      platform={matchInfo.season_platform}
      externalMatchRoomId={matchInfo.external_match_room_id}
      externalMatchRoomUrl={createExternalMatchRoomUrl(
        matchInfo.external_match_room_id,
        matchInfo.season_platform
      )}
    />
  );
}
