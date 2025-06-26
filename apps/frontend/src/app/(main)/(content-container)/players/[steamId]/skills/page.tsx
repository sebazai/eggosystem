import type { Metadata } from "next";
import { envConfig } from "@/configs/env";
import type { SteamPlayer } from "@eggosystem/types";
import { createPageMetadata } from "@/lib/metadata";
import PlayerTabLayoutClient from "../PlayerTabLayoutClient";
import { PlayerSkillsContent } from "./PlayerSkillsContent";

interface PlayerSkillsProps {
  params: Promise<{
    steamId: string;
  }>;
}

export async function generateMetadata({
  params
}: PlayerSkillsProps): Promise<Metadata> {
  const { steamId } = await params;

  const result = await fetch(`${envConfig.API_URL}/api/v1/players/${steamId}`);

  if (!result.ok) {
    return {
      title: "Failed to fetch player"
    };
  }
  const data: SteamPlayer = await result.json();
  return createPageMetadata({
    title: `Skills - ${data.nickname}`
  });
}

export default async function PlayerSkillsPage({ params }: PlayerSkillsProps) {
  const { steamId } = await params;

  return (
    <PlayerTabLayoutClient steamId={steamId}>
      <PlayerSkillsContent steamId={steamId} />
    </PlayerTabLayoutClient>
  );
}
