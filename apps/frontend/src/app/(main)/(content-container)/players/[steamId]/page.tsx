import React from "react";
import { PlayerSummary } from "@/components/players/PlayerSummary";
import type { Metadata } from "next";
import { envConfig } from "@/configs/env";
import type { SteamPlayer } from "@eggosystem/types";
import { createPageMetadata } from "@/lib/metadata";
import { ContentContainer } from "@/components/layout/ContentContainer";
import PlayerTabLayoutClient from "./PlayerTabLayoutClient";

interface PlayerDetailsProps {
  params: Promise<{
    steamId: string;
  }>;
}

export async function generateMetadata({
  params
}: PlayerDetailsProps): Promise<Metadata> {
  const { steamId } = await params;

  const result = await fetch(`${envConfig.API_URL}/api/v1/players/${steamId}`);

  if (!result.ok) {
    return {
      title: "Failed to fetch player"
    };
  }
  const data: SteamPlayer = await result.json();
  return createPageMetadata({
    title: `Player details for ${data.nickname}`
  });
}

export default async function PlayerDetailsPage({
  params
}: PlayerDetailsProps) {
  const unwrappedParams = await params;
  const steamId = unwrappedParams.steamId;

  const result = await fetch(`${envConfig.API_URL}/api/v1/players/${steamId}`);

  if (!result.ok && result.status === 404) {
    return <ContentContainer>{result.statusText}</ContentContainer>;
  }

  return (
    <PlayerTabLayoutClient steamId={steamId}>
      <PlayerSummary steamId={steamId} />
    </PlayerTabLayoutClient>
  );
}
