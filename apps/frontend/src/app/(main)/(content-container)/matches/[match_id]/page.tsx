import { MatchStatus, type MatchInfo } from "@eggosystem/types";
import { getMatchInfo } from "./utils";
import { MatchStats } from "@/components/matches/match/MatchStats";
import { GameStats } from "@/components/matches/match/game/GameStats";
import { createExternalMatchRoomUrl } from "@/components/matches/match/utils";
import { UpcomingMatchStats } from "@/components/matches/upcoming/UpcomingMatchStats";

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
  if (!Array.isArray(result.match_game_ids) && result.match_game_ids) {
    return (
      <GameStats
        matchId={matchId}
        matchGameId={result.match_game_ids}
        matchInfo={result}
        platform={result.season_platform}
        externalMatchRoomUrl={createExternalMatchRoomUrl(
          result.external_match_room_id,
          result.season_platform
        )}
      />
    );
  }
  if (result.status === MatchStatus.SCHEDULED) {
    return <UpcomingMatchStats matchId={matchId} matchInfo={result} />;
  }
  return (
    <MatchStats
      matchId={matchId}
      matchInfo={result}
      platform={result.season_platform}
      externalMatchRoomUrl={createExternalMatchRoomUrl(
        result.external_match_room_id,
        result.season_platform
      )}
    />
  );
}
