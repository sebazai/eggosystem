import { HallOfFamePage } from "@/components/hall-of-fame/HallOfFamePage";
import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = createPageMetadata({
  title: "Hall of Fame",
  description:
    "The most decorated organizations, teams, and players in Kanaliiga history"
});

export default function HallOfFame() {
  return <HallOfFamePage />;
}
