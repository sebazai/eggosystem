import type { Metadata } from "next";
import { envConfig } from "@/configs/env";
import { PlayerMatchGameView } from "@/components/players/match-game/PlayerMatchGameView";
import type { MatchInfo } from "@eggosystem/types";
import { createPageMetadata } from "@/lib/metadata";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";

interface PageProps {
  params: Promise<{
    steamId: string;
    matchId: string;
    matchGameId: string;
  }>;
}

interface MatchGameInfo {
  map_order: number;
  map_id: number;
  name: string;
}

async function fetchMatchInfo(matchId: number): Promise<MatchInfo | null> {
  try {
    const res = await fetch(
      `${envConfig.API_URL}/api/v1/matches/${matchId}/info`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.teams === "string") {
      data.teams = JSON.parse(data.teams);
    }
    return data as MatchInfo;
  } catch {
    return null;
  }
}

async function fetchMatchGameInfo(
  matchGameId: number
): Promise<MatchGameInfo | null> {
  try {
    const res = await fetch(
      `${envConfig.API_URL}/api/v1/match-games/${matchGameId}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { matchId, matchGameId } = await params;
  const matchIdNum = parseInt(matchId, 10);
  const matchGameIdNum = parseInt(matchGameId, 10);

  if (isNaN(matchIdNum) || isNaN(matchGameIdNum)) {
    return { title: "Player Match Stats" };
  }

  const [matchInfo, gameInfo] = await Promise.all([
    fetchMatchInfo(matchIdNum),
    fetchMatchGameInfo(matchGameIdNum)
  ]);

  const teams = matchInfo ? Object.values(matchInfo.teams) : [];
  const opponentName = teams.length >= 2 ? teams[1]?.name : "Unknown";
  const mapName = gameInfo?.name ?? "Map";

  return createPageMetadata({
    title: `${mapName} vs ${opponentName} — Player Stats`
  });
}

export default async function PlayerMatchGamePage({ params }: PageProps) {
  const { steamId, matchId, matchGameId } = await params;
  const matchIdNum = parseInt(matchId, 10);
  const matchGameIdNum = parseInt(matchGameId, 10);

  if (isNaN(matchIdNum) || isNaN(matchGameIdNum)) {
    return (
      <div className="w-full">
        <p className="text-muted-foreground">Invalid match or game ID.</p>
      </div>
    );
  }

  const [matchInfo, gameInfo] = await Promise.all([
    fetchMatchInfo(matchIdNum),
    fetchMatchGameInfo(matchGameIdNum)
  ]);

  if (!matchInfo) {
    return (
      <div className="w-full">
        <p className="text-muted-foreground">
          Could not load match information.
        </p>
      </div>
    );
  }

  const mapName = gameInfo?.name ?? "unknown";

  return (
    <div className="w-full space-y-4">
      <AutoBreadcrumbs />
      <PlayerMatchGameView
        matchId={matchIdNum}
        matchGameId={matchGameIdNum}
        steamId={steamId}
        mapName={mapName}
        matchInfo={matchInfo}
        bestOf={matchInfo.best_of ?? 1}
      />
    </div>
  );
}
