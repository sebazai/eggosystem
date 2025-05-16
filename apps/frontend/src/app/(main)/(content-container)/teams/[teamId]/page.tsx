import React from "react";
import { AutoBreadcrumbs } from "@/components/layout/auto-breadcrumbs";
import type { Metadata, ResolvedMetadata } from "next";
import { envConfig } from "@/configs/env";
import type { Team } from "@eggosystem/types";
import { TeamPageWithFilters } from "@/components/teams/team-page";
import { createPageMetadata } from "@/lib/metadata";
import { createTeamLogoUrl } from "@/lib/utils";

interface TeamDetailsPageProps {
  params: Promise<{
    teamId: string;
  }>;
}
export async function generateMetadata(
  { params }: TeamDetailsPageProps,
  parent: Promise<ResolvedMetadata>
): Promise<Metadata> {
  const { teamId } = await params;

  const result = await fetch(`${envConfig.API_URL}/api/v1/teams/${teamId}`);

  if (!result.ok) {
    return {
      title: "Failed to fetch team"
    };
  }
  const data: Team = await result.json();
  const previousImages = (await parent).openGraph?.images || [];
  const teamLogoUrl = createTeamLogoUrl(data.team_logo);
  return createPageMetadata({
    title: `Team details for ${data.name}`,
    openGraph: {
      images: [teamLogoUrl, ...previousImages]
    }
  });
}

export default async function TeamDetailsPage({
  params
}: TeamDetailsPageProps) {
  const unwrappedParams = await params;
  const teamId = Number(unwrappedParams.teamId);

  return (
    <div className="mx-auto py-4 px-2">
      <AutoBreadcrumbs />
      <TeamPageWithFilters teamId={teamId} />
    </div>
  );
}
