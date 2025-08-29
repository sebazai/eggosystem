import type { MatchInfo, MatchTeamInfo } from "@eggosystem/types";
import { UpcomingMatchStats } from "@/components/matches/upcoming/UpcomingMatchStats";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";
import { getMatchInfo } from "../../[match_id]/utils";
import { createExternalMatchRoomUrl } from "@/components/matches/match/utils";

// Local interface with teams as array instead of object
interface ProcessedMatchInfo extends Omit<MatchInfo, "teams"> {
  teams: MatchTeamInfo[];
}

interface PageProps {
  params: Promise<{ match_id: string }>;
}

export default async function UpcomingMatchPage({ params }: PageProps) {
  const { match_id } = await params;
  // Convert match_id to a number
  const matchId = parseInt(match_id, 10);

  // Check if match_id is a valid number
  if (isNaN(matchId)) {
    throw new Error("Invalid match_id");
  }

  // Get match info from API (reusing the same utility as regular match page)
  const result = await getMatchInfo<MatchInfo>(matchId);

  // Convert teams from object to array (same as regular match page layout)
  const teams = Object.values(result.teams);
  if (teams.length < 2) {
    throw new Error("Not enough teams found for match");
  }

  // Create processed match info with teams as array
  const processedMatchInfo: ProcessedMatchInfo = {
    ...result,
    teams: teams
  };

  return (
    <>
      <div className="px-4 pt-4">
        <AutoBreadcrumbs />
      </div>

      <UpcomingMatchStats
        matchId={matchId}
        matchInfo={processedMatchInfo}
        platform={result.season_platform}
        externalMatchRoomUrl={createExternalMatchRoomUrl(
          result.external_match_room_id,
          result.season_platform
        )}
      />
    </>
  );
}
