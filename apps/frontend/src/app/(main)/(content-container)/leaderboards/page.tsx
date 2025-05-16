import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = createPageMetadata({
  title: "Leaderboards",
  description: "The players that perform in Kanaliiga"
});

export default function LeaderboardsPage() {
  return <LeaderboardsPage />;
}
