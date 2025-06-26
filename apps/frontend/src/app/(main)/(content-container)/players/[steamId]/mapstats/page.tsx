import type { Metadata } from "next";
import { envConfig } from "@/configs/env";
import type { SteamPlayer } from "@eggosystem/types";
import { createPageMetadata } from "@/lib/metadata";
import PlayerTabLayoutClient from "../PlayerTabLayoutClient";
import { PlayerMapStatsContent } from "./PlayerMapStatsContent";

interface PlayerMapStatsProps {
  params: Promise<{
    steamId: string;
  }>;
}

export async function generateMetadata({
  params
}: PlayerMapStatsProps): Promise<Metadata> {
  const { steamId } = await params;

  const result = await fetch(`${envConfig.API_URL}/api/v1/players/${steamId}`);

  if (!result.ok) {
    return {
      title: "Failed to fetch player"
    };
  }
  const data: SteamPlayer = await result.json();
  return createPageMetadata({
    title: `Map Statistics - ${data.nickname}`
  });
}

export default async function PlayerMapStatsPage({
  params
}: PlayerMapStatsProps) {
  const { steamId } = await params;

  return (
    <PlayerTabLayoutClient steamId={steamId}>
      <PlayerMapStatsContent steamId={steamId} />
    </PlayerTabLayoutClient>
  );
}
