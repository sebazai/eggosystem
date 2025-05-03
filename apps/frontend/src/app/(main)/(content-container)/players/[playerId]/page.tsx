import React from "react";
import { AutoBreadcrumbs } from "@/components/layout/auto-breadcrumbs";
import { PlayerPageWithFilters } from "@/components/players/player-page";
import type { Metadata } from "next";
import { envConfig } from "@/configs/env";
import type { SteamPlayer } from "@eggosystem/types";

interface PlayerDetailsProps {
  params: Promise<{
    playerId: string;
  }>;
}

export async function generateMetadata({
  params
}: PlayerDetailsProps): Promise<Metadata> {
  const { playerId } = await params;

  const result = await fetch(`${envConfig.API_URL}/api/v1/players/${playerId}`);

  if (!result.ok) {
    return {
      title: "Failed to fetch player"
    };
  }
  const data: SteamPlayer = await result.json();
  return {
    title: `Player details for ${data.nickname}`
  };
}

export default async function PlayerDetailsPage({
  params
}: PlayerDetailsProps) {
  const unwrappedParams = await params;
  const steamId = unwrappedParams.playerId;

  return (
    <div className="container mx-auto py-4">
      <div className="mb-3">
        <AutoBreadcrumbs />
      </div>

      <div className="mb-3">
        <h2 className="text-xl font-semibold mb-2">Filter Statistics</h2>
        <PlayerPageWithFilters steamId={steamId} />
      </div>
    </div>
  );
}
