import { Suspense } from "react";
import { envConfig } from "@/configs/env";
import type { MatchInfo } from "@eggosystem/types";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { PlayerMatchView } from "@/components/players/match/PlayerMatchView";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{ steamId: string; matchId: string }>;
}

interface GameInfo {
  map_order: number;
  map_id: number;
  name: string;
}

async function fetchMatchInfo(matchId: number): Promise<MatchInfo | null> {
  try {
    const res = await fetch(
      `${envConfig.API_URL}/api/v1/matches/${matchId}/info`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.teams === "string") data.teams = JSON.parse(data.teams);
    return data as MatchInfo;
  } catch {
    return null;
  }
}

async function fetchGameInfo(gameId: number): Promise<GameInfo | null> {
  try {
    const res = await fetch(
      `${envConfig.API_URL}/api/v1/match-games/${gameId}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PlayerMatchPage({ params }: PageProps) {
  const { steamId, matchId } = await params;
  const matchIdNum = parseInt(matchId, 10);

  if (isNaN(matchIdNum)) {
    return (
      <ContentContainer>
        <p className="text-muted-foreground">Invalid match ID.</p>
      </ContentContainer>
    );
  }

  const matchInfo = await fetchMatchInfo(matchIdNum);

  if (!matchInfo) {
    return (
      <ContentContainer>
        <p className="text-muted-foreground">
          Could not load match information.
        </p>
      </ContentContainer>
    );
  }

  const rawIds = matchInfo.match_game_ids;
  const gameIds: number[] = Array.isArray(rawIds)
    ? rawIds
    : rawIds != null
      ? [rawIds as number]
      : [];

  const games = (
    await Promise.all(
      gameIds.map(async (id) => {
        const info = await fetchGameInfo(id);
        return {
          id,
          name: info?.name ?? "unknown",
          mapOrder: info?.map_order ?? 0
        };
      })
    )
  ).sort((a, b) => a.mapOrder - b.mapOrder);

  return (
    <div className="w-full space-y-4">
      <AutoBreadcrumbs />
      {games.length === 0 ? (
        <p className="text-muted-foreground">
          No game data available for this match.
        </p>
      ) : (
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
          <PlayerMatchView
            games={games}
            steamId={steamId}
            matchId={matchIdNum}
            matchInfo={matchInfo}
            bestOf={matchInfo.best_of ?? 1}
          />
        </Suspense>
      )}
    </div>
  );
}
