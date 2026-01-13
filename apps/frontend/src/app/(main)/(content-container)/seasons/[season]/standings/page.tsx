import type { Metadata } from "next";
import { envConfig } from "@/configs/env";
import type { SeasonDetails } from "@eggosystem/types";
import { createPageMetadata } from "@/lib/metadata";
import StandingsPage from "@/components/standings/StandingsPage";

type StandingsPageProps = {
  params: Promise<{ season: string }>;
};

export async function generateMetadata({
  params
}: StandingsPageProps): Promise<Metadata> {
  const { season } = await params;

  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  const data: SeasonDetails = await result.json();

  if (result.ok) {
    return createPageMetadata({
      title: `Standings for ${data.full_name}`
    });
  }
  return createPageMetadata({
    title: `Standings for season`
  });
}

export default async function Standings({ params }: StandingsPageProps) {
  const { season } = await params;
  return <StandingsPage seasonId={season} />;
}
