import type { MatchInfo } from "@eggosystem/types";
import { getMatchInfo } from "./utils";
import { MatchStats } from "@/components/matches/match/match-stats";

interface PageProps {
  params: Promise<{ match_id: string }>;
}

export default async function MatchPage({ params }: PageProps) {
  const { match_id } = await params;
  const result = await getMatchInfo<MatchInfo>(match_id);
  return <MatchStats matchId={match_id} teams={result.teams} />;
}
