import type { MatchInfo } from "@eggosystem/types";
import { UpcomingMatchStats } from "@/components/matches/upcoming/UpcomingMatchStats";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";

// Function to fetch match info
async function getMatchInfo<T>(_matchId: number): Promise<T> {
  // In a real scenario, we would fetch from API
  // const res = await fetch(`${envConfig.API_URL}/api/v1/matches/${matchId}/info`);
  // if (!res.ok) throw new Error("Failed to fetch match info");
  // const result = await res.json();

  // Instead, we return our dummy data
  // This simulates what the API would return
  return DUMMY_MATCH_INFO as unknown as T;
}

// Dummy data for demonstration
const DUMMY_MATCH_INFO: MatchInfo = {
  id: 12345,
  match_id: 12345,
  date: "2023-12-30T18:00:00.000Z",
  season_id: 5,
  league_id: 3,
  season_name: "Spring 2023",
  league_name: "Divari",
  season_platform: "FACEIT", // This is used as a string, not an enum
  external_match_room_id: "1234567",
  teams: {
    "0": {
      id: 101,
      name: "Phoenix Gaming",
      logo: "teams/phoenix.png",
      organization_name: "Phoenix Esports",
      rank: 1,
      score: 0
    },
    "1": {
      id: 102,
      name: "Arctic Wolves",
      logo: "teams/wolves.png",
      organization_name: "Arctic Gaming",
      rank: 2,
      score: 0
    }
  },
  best_of: 3,
  status: "scheduled",
  game_ids: null,
  demo_link: null,
  playoffs: false,
  walkover: false,
  void: false,
  match_date: "2023-12-30",
  start_time: "18:00:00",
  end_time: "20:30:00"
};

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

  // Get match info (using dummy data)
  const result = await getMatchInfo<MatchInfo>(matchId);

  return (
    <>
      <div className="px-4 pt-4">
        <AutoBreadcrumbs />
      </div>

      <UpcomingMatchStats
        matchId={matchId}
        matchInfo={result}
        platform={result.season_platform}
        externalMatchRoomUrl={
          result.external_match_room_id
            ? `https://play.esea.net/match/${result.external_match_room_id}`
            : null
        }
      />
    </>
  );
}
