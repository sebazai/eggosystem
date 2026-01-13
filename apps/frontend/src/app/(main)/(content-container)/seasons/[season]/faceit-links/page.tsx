import type { Metadata } from "next";
import { envConfig } from "@/configs/env";
import type { SeasonDetails } from "@eggosystem/types";
import { createPageMetadata } from "@/lib/metadata";
import { FaceitLinksPage } from "@/components/season/FaceitLinksPage";

type FaceitLinksPageProps = {
  params: Promise<{ season: string }>;
};

export async function generateMetadata({
  params
}: FaceitLinksPageProps): Promise<Metadata> {
  const { season } = await params;

  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  const data: SeasonDetails = await result.json();

  if (result.ok) {
    return createPageMetadata({
      title: `Faceit links for ${data.full_name}`
    });
  }
  return createPageMetadata({
    title: `Faceit links for season`
  });
}

export default async function FaceitLinks({ params }: FaceitLinksPageProps) {
  const { season } = await params;
  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  const data: SeasonDetails = await result.json();

  return <FaceitLinksPage seasonId={season} seasonName={data.full_name} />;
}
