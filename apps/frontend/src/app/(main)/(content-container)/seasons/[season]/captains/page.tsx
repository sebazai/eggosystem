import type { Metadata } from "next";
import { envConfig } from "@/configs/env";
import type { SeasonDetails } from "@eggosystem/types";
import { createPageMetadata } from "@/lib/metadata";
import { CaptainsPage } from "@/components/season/CaptainsPage";

type CaptainsPage = {
  params: Promise<{ season: string }>;
};

export async function generateMetadata({
  params
}: CaptainsPage): Promise<Metadata> {
  const { season } = await params;

  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  const data: SeasonDetails = await result.json();

  if (result.ok) {
    return createPageMetadata({
      title: `Captains for ${data.full_name}`
    });
  }
  return createPageMetadata({
    title: `Captains for season`
  });
}

export default async function Captains({ params }: CaptainsPage) {
  const { season } = await params;
  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  const data: SeasonDetails = await result.json();

  return <CaptainsPage seasonId={season} seasonName={data.full_name} />;
}
