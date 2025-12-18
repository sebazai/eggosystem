import { SeasonResultsPage } from "@/components/season-results/SeasonResultsPage";
import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = createPageMetadata({
  title: "Season Results",
  description: "Top 3 teams from each division for past Kanaliiga seasons"
});

export default function SeasonResults() {
  return <SeasonResultsPage />;
}
