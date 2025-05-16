import { TopTeamsPage } from "@/components/topteams/top-teams-page";
import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = createPageMetadata({
  title: "Top teams",
  description: "The teams that perform well in Kanaliiga"
});

export default function TopTeams() {
  return <TopTeamsPage />;
}
