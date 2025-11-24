import type { Metadata } from "next";
import { envConfig } from "@/configs/env";
import type { SeasonDetails } from "@eggosystem/types";
import { createPageMetadata } from "@/lib/metadata";
import FantasyLeague from "@/components/fantasy/FantasyLeague";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";

type FantasyPage = {
  params: Promise<{ season: string }>;
};

export async function generateMetadata({
  params
}: FantasyPage): Promise<Metadata> {
  const { season } = await params;

  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`,
    { cache: "no-store" }
  );

  if (!result.ok) {
    return createPageMetadata({
      title: `Fantasy League`
    });
  }

  const data: SeasonDetails = await result.json();

  if (result.ok) {
    return createPageMetadata({
      title: `Fantasy League - ${data.full_name}`
    });
  }
  return createPageMetadata({
    title: `Fantasy League`
  });
}

export default async function Fantasy({ params }: FantasyPage) {
  const { season } = await params;
  return (
    <>
      <AutoBreadcrumbs />
      <div className="fantasy-content-scale">
        <FantasyLeague seasonId={season} />
      </div>
    </>
  );
}
