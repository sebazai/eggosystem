import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { MatchesView } from "@/components/matches/MatchesView";

export const metadata: Metadata = createPageMetadata({
  title: "Match History",
  description: "Browse match history from Kanaliiga seasons"
});

export default function AllMatches() {
  return <MatchesView />;
}
