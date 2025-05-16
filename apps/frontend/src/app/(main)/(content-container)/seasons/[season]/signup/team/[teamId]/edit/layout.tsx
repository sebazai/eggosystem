import type { SeasonDetails, Team } from "@eggosystem/types";
import type { Metadata } from "next";
import type React from "react";

import { envConfig } from "@/configs/env";
import { createPageMetadata } from "@/lib/metadata";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ season: string; teamId: string }>;
}

export async function generateMetadata({
  params
}: LayoutProps): Promise<Metadata> {
  const { season, teamId } = await params;

  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  const teamResult = await fetch(`${envConfig.API_URL}/api/v1/teams/${teamId}`);

  const data: SeasonDetails = await result.json();
  const teamData: Team = await teamResult.json();
  if (result.ok && teamResult.ok) {
    return createPageMetadata({
      title: `Edit team ${teamData.name} for ${data.full_name}`
    });
  }
  if (result.ok && !teamResult.ok) {
    return createPageMetadata({
      title: `Team edit for ${data.full_name}`
    });
  }
  return createPageMetadata({
    title: `Team edit for season`
  });
}

export default async function Layout({ children }: LayoutProps) {
  return <div>{children}</div>;
}
