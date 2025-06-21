import React from "react";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { PlayersPage } from "@/components/players/PlayersPage";

export const metadata: Metadata = createPageMetadata({
  title: "Players",
  description: "Players in Kanaliiga"
});

export default function Players() {
  return <PlayersPage />;
}
