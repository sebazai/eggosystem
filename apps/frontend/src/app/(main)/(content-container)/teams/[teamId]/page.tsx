import React from "react";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";
import type { Metadata, ResolvedMetadata } from "next";
import { envConfig } from "@/configs/env";
import type { Team } from "@eggosystem/types";
import { TeamMainContent } from "@/components/teams/TeamMainContent";
import { createPageMetadata } from "@/lib/metadata";
import { createBaseUrl, createTeamLogoUrl } from "@/lib/utils";
import TeamTabLayoutClient from "./TeamTabLayoutClient";

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
  const logoResponse = await fetch(createBaseUrl(teamLogoUrl), {
    method: "HEAD"
  });
  const logoExists = logoResponse.ok;
  return createPageMetadata({
    title: `Team details for ${data.name}`,
    openGraph: {
      images: logoExists ? [teamLogoUrl] : previousImages
    }
  });
}

export default async function TeamDetailsPage({
  params
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <div className="mx-auto py-4 px-2">
      <AutoBreadcrumbs />
      <TeamTabLayoutClient teamId={teamId}>
        <TeamMainContent />
      </TeamTabLayoutClient>
    </div>
  );
}
