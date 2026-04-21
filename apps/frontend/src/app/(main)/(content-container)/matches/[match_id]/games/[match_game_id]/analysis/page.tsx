import type { MatchGame, MatchInfo } from "@eggosystem/types";
import { getMatchGame, getMatchInfo } from "../../../utils";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { MatchGameAnalysis } from "@/components/matches/match/game/analysis/MatchGameAnalysis";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ match_id: string; match_game_id: string }>;
}

export default async function MatchGameAnalysisPage({ params }: PageProps) {
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
    <div className="space-y-4 sm:space-y-6 p-1 sm:p-3 max-w-5xl mx-auto">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/matches/${matchId}/games/${matchGameId}`}>
          <ChevronLeft className="size-4" />
          Back to game stats
        </Link>
      </Button>

      <div>
        <h1 className="text-xl font-bold uppercase tracking-wide">
          Detailed Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          In-depth breakdown of afterplant situations, retakes, and more.
        </p>
      </div>

      <MatchGameAnalysis matchGameId={matchGameId} matchInfo={matchInfo} />
    </div>
  );
}
