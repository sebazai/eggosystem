import { KanaLeaderboardPage } from "@/components/kana-leaderboard/KanaLeaderboardPage";
import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = createPageMetadata({
  title: "Kana Elo Leaderboard",
  description: "The top 50 players by live kana elo in Kanaliiga"
});

export default function KanaLeaderboard() {
  return <KanaLeaderboardPage />;
}
