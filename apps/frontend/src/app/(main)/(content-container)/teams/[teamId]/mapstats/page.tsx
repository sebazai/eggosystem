import React from "react";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";
import { TeamMapStatsContent } from "@/components/teams/TeamMapStatsContent";
import TeamTabLayoutClient from "../TeamTabLayoutClient";

export default async function TeamMapStatsPage({
  params
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <div className="mx-auto py-4 px-2">
      <AutoBreadcrumbs />
      <TeamTabLayoutClient teamId={teamId}>
        <TeamMapStatsContent />
      </TeamTabLayoutClient>
    </div>
  );
}
