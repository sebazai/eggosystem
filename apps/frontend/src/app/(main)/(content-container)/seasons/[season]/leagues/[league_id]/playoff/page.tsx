import type { Metadata } from "next";
import { envConfig } from "@/configs/env";
import type { SeasonDetails } from "@eggosystem/types";
import { createPageMetadata } from "@/lib/metadata";
import { PlayoffPageContent } from "./PlayoffPageContent";

type PlayoffPageProps = {
  params: Promise<{ season: string; league_id: string }>;
};

export async function generateMetadata({
  params
}: PlayoffPageProps): Promise<Metadata> {
  const { season } = await params;

  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  const data: SeasonDetails = await result.json();

  if (result.ok) {
    return createPageMetadata({
      title: `Playoff bracket for ${data.full_name}`
    });
  }
  return createPageMetadata({
    title: "Playoff bracket"
  });
}

export default async function PlayoffPage({ params }: PlayoffPageProps) {
  const { season, league_id } = await params;
  return <PlayoffPageContent seasonId={season} leagueId={league_id} />;
}
